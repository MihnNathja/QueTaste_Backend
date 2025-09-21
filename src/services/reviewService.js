const Order = require("../models/Order");
const Product = require("../models/Product");
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
            throw new Error(("Bạn đã đánh giá sản phẩm này rồi."))
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

    static async getReviewsByProduct({ productId, rating, orderBy = "newest", page = 1, limit = 10 } = {}) {
       console.log("Rating: ", rating);
       console.log("ProductId: ", productId);
        try {
            const query = {};

            // lọc theo productId
            if (productId) {
            query.product = productId;
            }

            // lọc theo rating (nếu có)
            if (rating) {
            query.rating = rating;
            }

            // sắp xếp theo thời gian
            const sortOrder = orderBy === "newest" ? -1 : 1;

            // đếm tổng số review (để phân trang)
            const total = await Review.countDocuments(query);

            // lấy review
            const reviews = await Review.find(query)
            .sort({ createdAt: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate({
                path: "user",
                model: "User",
                select: "email personalInfo.fullName avatar"
            });

            return {
                items: reviews,
                pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
                }
            };
        } catch (err) {
            console.error("Error in getReviewsByProduct:", err.message);
            throw new Error("Không thể lấy danh sách đánh giá");
        }
    }

}

module.exports = ReviewService;