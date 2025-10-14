const express = require("express");
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.post("/checkout", authMiddleware, orderController.checkout);
router.get("/me", authMiddleware, orderController.getMyOrders);
router.post("/cancel/:orderId", authMiddleware, orderController.cancelOrder);
router.post(
  "/request-cancel/:orderId",
  authMiddleware,
  orderController.requestCancelOrder
);
router.post("/momo/notify", orderController.momoNotify);
router.post("/update-status", orderController.updateStatus);
router.put("/confirm/:orderId", orderController.confirmOrder);
router.put("/confirmOrders", orderController.confirmOrders);

//router.get("/get-all", authMiddleware, adminMiddleware, orderController.getAllOrders)
router.get("/get-all", orderController.getAllOrders);

module.exports = router;
