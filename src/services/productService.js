const Product = require("../models/Product");
const Order = require("../models/Order");
const Review = require("../models/Review");
const cloudinary = require("../config/cloudinary");
class ProductService {
  static async getAllProducts(query, opts = {}) {
   const visibility = opts.visibility === 'admin' ? 'admin' : 'public';
    const {
      page = 1,
      limit = 10,
      search = "",
      category,
      region,
      rating,
      minPrice,
      maxPrice,
      sortBy = "createdAt", // createdAt | totalSold | views | price | rating | discount
      order = "desc",
      includeInactive,
    } = query;

    const filter = {};
    if (visibility !== 'admin') filter.isActive = true;

    if (search) filter.name = { $regex: search, $options: "i" };
    if (category) filter.category = category;
    if (region) filter.region = region;
    if (rating) filter.averageRating = { $gte: Number(rating) };
    if (minPrice || maxPrice) {
      filter.salePrice = {};
      if (minPrice) filter.salePrice.$gte = Number(minPrice);
      if (maxPrice) filter.salePrice.$lte = Number(maxPrice);
    }

    let dir = -1; 
    if (order === "asc")  dir = 1;
    
    let sort = { createdAt: -1 };

    if (sortBy === "totalSold") sort = { totalSold: dir };
    else if (sortBy === "views") sort = { views: dir };
    else if (sortBy === "price") sort = { salePrice: dir, price: dir };
    else if (sortBy === "rating")
      sort = { averageRating: dir, totalReviews: -1 };
    else if (sortBy === "createdAt") sort = { createdAt: dir };

    const shouldPaginate = !!limit && limit !== "all" && Number(limit) > 0;
    let q = Product.find(filter).sort(sort);
    if (shouldPaginate) {
      q = q.skip((page - 1) * Number(limit)).limit(Number(limit));
    }

    const filterNoStatus = { ...filter };
    delete filterNoStatus.isActive;

    const [products, total, totalActive, totalInactive, outOfStock] = await Promise.all([
      q,
      Product.countDocuments(filterNoStatus),
      Product.countDocuments({ ...filterNoStatus, isActive: true }),
      Product.countDocuments({ ...filterNoStatus, isActive: false }),
      Product.countDocuments({ ...filterNoStatus, stock: 0 }),
    ]);

    return {
      products,
      total,
      currentPage: shouldPaginate ? parseInt(page) : 1,
      totalPage: shouldPaginate ? Math.ceil(total / Number(limit)) : 1,
      stats: {
        total,
        active: totalActive,
        inactive: totalInactive,
        outOfStock,
      },
    };
  }

    static async getSuggestions(q, opts = {}) {
    const { limit = 8, visibility } = opts;
    const filter = {};

    if (visibility !== "admin") filter.isActive = true;

    filter.$or = [
      { name: { $regex: q, $options: "i" } },
    ];

    const projection = { name: 1, images: 1, salePrice: 1, price: 1 };

    // Ưu tiên bán chạy rồi mới tới mới nhất
    const sort = { totalSold: -1, createdAt: -1 };

    const items = await Product.find(filter, projection).sort(sort).limit(limit);
    return items;
  }

  static async getProductById(id, opts = {}) {
    const visibility = opts.visibility === 'admin' ? 'admin' : 'public';
    const product = await Product.findById(id);
    if (!product) throw new Error("Product not found");
    if (visibility !== 'admin' && !product.isActive) throw new Error("Product not found");

    product.views += 1;
    await product.save();

    return product;
  }

  static async getRelatedProducts(productId, limit = 5) {
    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");

    return Product.find({
      _id: { $ne: productId },
      category: product.category,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  static async getProductStats(productId) {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw new Error("Product not found");
    }

    const [orders, reviews] = await Promise.all([
      Order.countDocuments({
        "items.productId": productId,
        status: "completed",
      }),
      Review.countDocuments({ productId }),
    ]);

    return { totalBuyers: orders, totalComments: reviews };
  }

  static async createProduct(data, files) {
    if (files && files.length > 0) {
      const uploaded = await Promise.all(
        files.map((f) => cloudinary.uploader.upload(f.path))
      );
      data.images = uploaded.map((u) => u.secure_url);
    }
    const product = new Product(data);
    return await product.save();
  }

  static async updateProduct(id, data, files) {
    const product = await Product.findById(id);
    if (!product) throw new Error("Product not found");

    console.log("📦 [updateProduct] Incoming data:", data);
    console.log("📸 [updateProduct] Files:", files?.length || 0);

    let existingImages = [];
    if (data.existingImages) {
      try {
        existingImages = JSON.parse(data.existingImages);
      } catch (err) {
        console.warn("⚠️ existingImages parse error:", err);
        existingImages = [];
      }
    } else {
      existingImages = product.images || [];
    }

    let newImageUrls = [];
    if (files && files.length > 0) {
      const uploaded = await Promise.all(
        files.map((f) => cloudinary.uploader.upload(f.path))
      );
      newImageUrls = uploaded.map((u) => u.secure_url);
    }

    const finalImages = [...existingImages, ...newImageUrls];

    const updatedData = {
      name: data.name,
      category: data.category,
      region: data.region,
      description: data.description,
      price: Number(data.price) || 0,
      salePrice: Number(data.salePrice) || 0,
      stock: Number(data.stock) || 0,
      images: finalImages,
    };

    Object.assign(product, updatedData);
    await product.save();

    console.log("✅ Product updated:", product._id);
    return product;
  }

  static async toggleActive(id) {
    const product = await Product.findById(id);
    if (!product) throw new Error("Product not found");
    product.isActive = !product.isActive;
    await product.save();
    return product;
  }

  static async deleteProduct(id) {
    const product = await Product.findById(id);
    if (!product) throw new Error("Product not found");

    if (product.images && product.images.length > 0) {
      const publicIds = product.images.map((url) =>
        url.split("/").pop().split(".")[0]
      );
      await Promise.all(publicIds.map((id) => cloudinary.uploader.destroy(id)));
    }

    await product.deleteOne();
    return true;
  }

  static async bulkSetActive(ids, isActive) {
    const r = await Product.updateMany(
      { _id: { $in: ids } },
      { $set: { isActive: !!isActive } }
    );
    return { matched: r.matchedCount ?? r.n, modified: r.modifiedCount ?? r.nModified };
  }
}

module.exports = ProductService;
