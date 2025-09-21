const ReviewService = require("../services/reviewService");
const sendResponse = require("../utils/response");

// POST /review
exports.createReview = async (req, res) => {
    try {
        //console.log("req.body: ", req.body);
        const review = await ReviewService.createReview(req.user.id, req.body);
        return sendResponse(res, 201, true, "Review created", review);
    } catch (err){
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
}