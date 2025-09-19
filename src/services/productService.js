const Product = require("../models/Product");
const Order = require("../models/Order");
const Review = require("../models/Review");
class ProductService {
    static async getAllProducts(query) {
        const {
            page = 1,
            limit,
            search = "",
            category,
            region,
            rating,
            minPrice,
            maxPrice,
            sortBy = "createdAt", // createdAt | totalSold | views | price | rating | discount
            order = "desc", 
        } = query;

        const filter = { isActive: true };
        if (search) filter.name = { $regex: search, $options: "i" };
        if (category) filter.category = category;
        if (region) filter.region = region;
        if (rating) filter.averageRating = { $gte: Number(rating) };
        if (minPrice || maxPrice) {
            filter.salePrice = {};
            if (minPrice) filter.salePrice.$gte = Number(minPrice);
            if (maxPrice) filter.salePrice.$lte = Number(maxPrice);
        }
            
        const dir = order === "asc" ? 1 : -1;
        let sort = { createdAt: -1 };

        if (sortBy === "totalSold") sort = { totalSold: dir };
        else if (sortBy === "views") sort = { views: dir };
        else if (sortBy === "price") sort = { salePrice: dir, price: dir };
        else if (sortBy === "rating") sort = { averageRating: dir, totalReviews: -1 };
        else if (sortBy === "createdAt") sort = { createdAt: dir };

        let q = Product.find(filter).sort(sort);
        if (limit) q = q.skip((page - 1) * limit).limit(parseInt(limit));

        const [products, total] = await Promise.all([q, Product.countDocuments(filter),]);

        return {
        products,
        total,
        currentPage: parseInt(page),
        totalPage: limit ? Math.ceil(total / limit) : 1,
        };
    }

    static async getProductById(id){
        const product = await Product.findById(id);
        if(!product || !product.isActive){
            throw new Error("Product not found");
        }

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
            Order.countDocuments({ "items.productId": productId, status: "completed" }),
            Review.countDocuments({ productId }),
        ]);

        return { totalBuyers: orders, totalComments: reviews};
    }


}

module.exports = ProductService;
