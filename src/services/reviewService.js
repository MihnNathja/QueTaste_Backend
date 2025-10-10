const Order = require("../models/Order");
const Product = require("../models/Product");
const Review = require("../models/Review");
const User = require("../models/User");

class ReviewService {
  static async createReview(userId, { productId, orderId, rating, comment }) {
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      "items.product": productId,
      status: "completed",
    });
    if (!order) {
      throw new Error(
        "Bạn chưa mua sản phẩm này hoặc đơn hàng của bạn chưa được hoàn tất"
      );
    }

    const orderItem = order.items.find(
      (item) => item.product.toString() === productId
    );
    if (!orderItem) {
      throw new Error("Sản phẩm không được tìm thấy trong đơn hàng.");
    }
    if (orderItem.isReviewed) {
      throw new Error("Bạn đã đánh giá sản phẩm này rồi.");
    }

    const review = await Review.create({
      user: userId,
      product: productId,
      order: orderId,
      rating,
      comment,
    });

    const stats = await Review.aggregate([
      { $match: { product: review.product } },
      {
        $group: {
          _id: "$product",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        averageRating: stats[0].avgRating,
        totalReviews: stats[0].count,
      });
    }
    orderItem.isReviewed = true;
    await order.save();

    return review;
  }

  static async getReviewsByProduct({
    productId,
    rating,
    orderBy = "newest",
    page = 1,
    limit = 10,
  } = {}) {
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
          select: "email personalInfo.fullName avatar",
        });

      return {
        items: reviews,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (err) {
      console.error("Error in getReviewsByProduct:", err.message);
      throw new Error("Không thể lấy danh sách đánh giá");
    }
  }

  static async getAllReviews({
    productId,
    rating,
    status,
    search,
    orderBy = "newest", // newest | oldest | highest | lowest
    page = 1,
    limit = 10,
  } = {}) {
    try {
      const query = {};

      // ====== Lọc theo sản phẩm ======
      if (productId) query.product = productId;

      // ====== Lọc theo rating ======
      if (rating) query.rating = rating;

      // ====== Lọc theo trạng thái ======
      if (status) query.status = status; // visible | hidden | reported

      // ====== Tìm kiếm (nội dung, email, tên user) ======
      if (search && search.trim() !== "") {
        const users = await User.find({
          $or: [
            { email: { $regex: search, $options: "i" } },
            { "personalInfo.fullName": { $regex: search, $options: "i" } },
          ],
        }).select("_id");

        query.$or = [
          { content: { $regex: search, $options: "i" } },
          { user: { $in: users.map((u) => u._id) } },
        ];
      }

      // ====== Xử lý sắp xếp ======
      let sortOption = {};
      switch (orderBy) {
        case "oldest":
          sortOption = { createdAt: 1 };
          break;
        case "highest":
          sortOption = { rating: -1, createdAt: -1 };
          break;
        case "lowest":
          sortOption = { rating: 1, createdAt: -1 };
          break;
        default:
          sortOption = { createdAt: -1 }; // newest
      }

      // ====== Đếm tổng số review ======
      const total = await Review.countDocuments(query);

      // ====== Lấy dữ liệu chính ======
      const reviews = await Review.find(query)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
          path: "user",
          model: "User",
          select: "email personalInfo.fullName avatar",
        })
        .populate({
          path: "product",
          model: "Product",
          select: "name image",
        });

      // ====== Trả về kết quả ======
      return {
        items: reviews,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (err) {
      console.error("Error in getAllReviews:", err.message);
      throw new Error("Không thể lấy danh sách đánh giá");
    }
  }
}

module.exports = ReviewService;
