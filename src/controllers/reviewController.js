const { earnPoints } = require("../services/pointTransactionService");
const ReviewService = require("../services/reviewService");
const sendResponse = require("../utils/response");
const { notifyAdmins } = require("../services/notificationService");
const User = require("../models/User");
const Product = require("../models/Product");
const POINT_REVIEW = 50;

// POST /review
exports.createReview = async (req, res) => {
  try {
    //console.log("req.body: ", req.body);
    const userId = req.user.id;
    const review = await ReviewService.createReview(userId, req.body);
    await earnPoints(userId, POINT_REVIEW, "Điểm thưởng đánh giá sản phẩm", 90);

    const user = await User.findById(userId);
    const product = await Product.findById(review.product);

    await notifyAdmins({
      type: "review",
      message: `Khách ${user.personalInfo.fullName} vừa đánh giá cho sản phẩm ${product.name}`,
      link: `/admin/reviews`,
      productId: product._id,
      mentionedUserId: user._id,
      sendEmail: true,
    });

    return sendResponse(res, 201, true, "Review created", review);
  } catch (err) {
    return sendResponse(res, 400, false, err.message);
  }
};

// GET /review
exports.getReviewsByProduct = async (req, res) => {
  try {
    //console.log("req.query: ", req.query);
    const reviews = await ReviewService.getReviewsByProduct(req.query);
    return sendResponse(res, 200, true, "Reviews fetched", reviews);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

// GET /review
exports.getAllReviews = async (req, res) => {
  try {
    //console.log("req.query: ", req.query);
    const reviews = await ReviewService.getAllReviews(req.query);
    return sendResponse(res, 200, true, "Reviews fetched", reviews);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

// DELETE /admin/delete/
exports.deleteReview = async (req, res) => {
  try {
    //console.log("req.query: ", req.query);
    const id = req.params.id;
    const reviews = await ReviewService.deleteReview(id);
    return sendResponse(res, 200, true, "Reviews fetched", reviews);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};
