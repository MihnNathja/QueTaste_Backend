const { default: mongoose } = require("mongoose");
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
    //console.log("Rating: ", rating);
    //console.log("ProductId: ", productId);
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
    search,
    orderBy = "newest", // newest | oldest | highest | lowest
    page = 1,
    limit = 10,
    includeDeleted = true, // ✅ admin: mặc định lấy cả đã xoá
    onlyDeleted = false, // ✅ tùy chọn: chỉ lấy bản đã xoá
  } = {}) {
    try {
      const query = {};

      // ====== Lọc theo sản phẩm ======
      if (productId) query.product = productId;

      // ====== Lọc theo rating ======
      if (rating) query.rating = rating;

      // ====== Soft-delete flags ======
      if (onlyDeleted) {
        // Chỉ lấy bản đã xoá
        query.isDeleted = true;
        // Không cần includeDeleted nữa vì đã filter trực tiếp
      } else if (includeDeleted) {
        // Lấy cả đã xoá lẫn chưa xoá (middleware sẽ bỏ filter mặc định)
        query.includeDeleted = true; // flag cho pre(/^find/)
      }
      // Nếu cả 2 false -> mặc định lấy chưa xoá (middleware tự thêm { isDeleted: false })

      // ====== Tìm kiếm (nội dung, email, tên user) ======
      if (search && search.trim() !== "") {
        const users = await User.find({
          $or: [
            { email: { $regex: search, $options: "i" } },
            { "personalInfo.fullName": { $regex: search, $options: "i" } },
          ],
        }).select("_id");

        query.$or = [
          { comment: { $regex: search, $options: "i" } },
          { user: { $in: users.map((u) => u._id) } },
        ];
      }

      // ====== Sắp xếp ======
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

      // ====== Đếm tổng số ======
      // Tránh bug do includeDeleted trong countDocuments (middleware count có thể chưa thêm)
      const countFilter = { ...query };
      delete countFilter.includeDeleted;

      const total = await Review.countDocuments(countFilter);

      console.log("QUERY USED IN FIND:", query);
      console.log("sortOption:", sortOption);
      // ====== Lấy dữ liệu ======
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
      console.error("Error in getAllReviews:", err);
      throw new Error("Không thể lấy danh sách đánh giá");
    }
  }

  static async deleteReview(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Đánh giá không hợp lệ");
      }

      const review = await Review.findById(id);
      if (!review) throw new Error("Không tìm thấy đánh giá để xóa");

      review.isDeleted = true;
      review.deletedAt = new Date();
      await review.save();

      return review;
    } catch (err) {
      console.error("Error in deleteReview:", err);
      // chỉ throw lại lỗi thực tế, đừng ném lỗi mới tràn lan
      throw err;
    }
  }
}

module.exports = ReviewService;
