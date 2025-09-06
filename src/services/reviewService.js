const Order = require("../models/Order");
const Review = require("../models/Review");



class ReviewService {
    static async createReview(userId, { productId, orderId, rating, comment}) {
        const order = await Order.findOne({
            _id: orderId,
            user: userId,
            "items.product": productId,
            status: "completed"
        });
        if (!order) {
            throw new Error("You have not purchased this product yet, or your order has not been completed.");
        } 
            
        const existing = await Review.findOne({ user: userId, product: productId, order: orderId});
        if (existing) {
            throw new Error(("You have already reviewed this product."))
        }

        const review = await Review.create({
            user: userId,
            product: productId,
            order: orderId,
            rating,
            comment
        });

        const stats = await Review.aggregate([
            { $match: { product: review.product }},
            { $group: { _id: "$product", avgRating: { $avg: "$rating" }, count: { $sum: 1 }}}
        ]);

        if (stats.length > 0) {
            await Product.findByIdAndUpdate(productId, {
                averageRating: stats[0].avgRating,
                totalReviews: stats[0].count
            });
        }

        return review;
    }

    static async getReviewsByProduct(productId){
        return await Review.find({ product: productId })
            .populate("User", "name email")
            .sort({ createdAt: -1});
    }
}

module.exports = ReviewService;