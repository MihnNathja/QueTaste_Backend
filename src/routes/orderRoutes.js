const express = require("express");
const orderController = require("../controllers/orderController");
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router();

router.post("/checkout", authMiddleware, orderController.checkout);
router.get("/me", authMiddleware, orderController.getMyOrders);
router.post("/cancel/:orderId", authMiddleware, orderController.cancelOrder);
router.post("/request-cancel/:orderId", authMiddleware, orderController.requestCancelOrder);
router.post("/momo/notify", orderController.momoNotify);
router.post("/update-status", orderController.updateStatus);

module.exports = router;