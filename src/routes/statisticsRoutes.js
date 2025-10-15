const express = require("express");
const statisticsController = require("../controllers/statisticsController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);
router.get("/summary", statisticsController.getSummary);
router.get("/compare", statisticsController.getCompare);
router.get("/weekly-profit", statisticsController.getWeeklyProfit);
router.get("/order-status", statisticsController.getOrderStatus);
router.get("/top-products", statisticsController.getTopProducts);
router.get("/new-customers", statisticsController.getNewCustomers);

router.get("/users/registrations-by-day", statisticsController.getUserRegistrationsByDay);
router.get("/users/top-spenders", statisticsController.getTopSpenders);
router.get("/users/buyer-ratio", statisticsController.getBuyerRatio);
router.get("/users", statisticsController.getAllUsers);
router.get("/users/:id", statisticsController.getUserById);

router.get("/posts/views-total", statisticsController.getPostsViewsTotal);
router.get("/posts/top", statisticsController.getTopPosts);
router.patch("/posts/:slug", statisticsController.updatePostBySlug);
router.patch("/posts/:slug/lock", statisticsController.lockPostBySlug);

module.exports = router;
