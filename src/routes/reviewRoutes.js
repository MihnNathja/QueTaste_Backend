const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const reviewController = require("../controllers/reviewController");

const router = express.Router();

router.post("/", authMiddleware, reviewController.createReview);

router.get("/", reviewController.getReviewsByProduct);

router.get("/admin", reviewController.getAllReviews);

module.exports = router;
