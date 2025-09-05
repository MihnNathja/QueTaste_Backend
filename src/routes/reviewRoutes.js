const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const reviewController = require("../controllers/reviewController");

const router = express.Router();

router.post("/", authMiddleware, reviewController.createReview);

router.get("/:productId", authMiddleware, reviewController.getReviewsByProduct);

module.exports = router;