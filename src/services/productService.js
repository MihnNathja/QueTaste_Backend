const Product = require("../models/Product");
const Order = require("../models/Order");

class ProductService {
    static async getAllProducts(query) {
        const { page = 1, limit, search = "" } = query;

        let q = Product.find({
            isActive: true,
            name: { $regex: search, $options: "i" },
        });

        if (limit) {
            q = q.skip((page - 1) * limit).limit(parseInt(limit));
        }

        return await q;
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

    static async getNewestProducts() {
        return await Product.find({ isActive: true })
            .sort({ createdAt: -1 })
            .limit(8);
    }

    static async getBestSellingProducts() {
        const result = await Order.aggregate([
            { $match: { status: "completed" } },
            { $unwind: "$items" },
            { $group: { _id: "$items.product", totalSold: { $sum: "$items.quantity" } } },
            { $sort: { totalSold: -1 } },
            { $limit: 6 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product",
                },
            },
            { $unwind: "$product" }
        ]);
        return result.map(r => r.product);
    }

    static async getMostViewedProducts() {
        return await Product.find({ isActive: true })
            .sort({ views: -1 })
            .limit(8);
    }

    static async getTopDiscountedProducts() {
        return await Product.aggregate([
            { $match: { isActive: true, salePrice: { $gt: 0 } } },
            {
                $addFields: {
                    discountPercent: {
                        $multiply: [
                            { $divide: [{ $subtract: ["$price", "$salePrice"] }, "$price"] },
                            100
                        ]
                    }
                }
            },
            { $sort: { discountPercent: -1 } },
            { $limit: 4 }
        ]);
    }
}

module.exports = ProductService;
