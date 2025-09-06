const ReviewService = require("../services/reviewService");
const sendResponse = require("../utils/response");

// POST /review
exports.createReview = async (req, res) => {
    try {
        const review = await ReviewService.createReview(req.user._id, req.body);
        return sendResponse(res, 201, true, "Review created", review);
    } catch {err}{
        return sendResponse(res, 400, false, err.message);
    }
};

// GET /review/:productId
exports.getReviewsByProduct = async (req, res) => {
    try {
        const reviews = await ReviewService.getReviewsByProduct(req.params.productId);
        return sendResponse(res, 200, true, "Reviews fetched", reviews);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
}