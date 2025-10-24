const express = require("express");
const orderController = require("../controllers/orderController");
const adminMiddleware = require("../middleware/adminMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const { isUser, isShipper } = require("../middleware/roleMiddleware");

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

router.post("/re-order/:orderId", authMiddleware, orderController.reOrder);

//router.get("/get-all", authMiddleware, adminMiddleware, orderController.getAllOrders)
router.get("/get-all", orderController.getAllOrders);
router.put("/confirmOrders", orderController.confirmOrders);
router.put("/cancelOrders", orderController.cancelOrders);

router.get(
  "/shipper",
  authMiddleware,
  isShipper,
  orderController.getOrdersForShipper
);
router.put(
  "/:id/update-to-done-shipping",
  authMiddleware,
  isShipper,
  orderController.markAsDoneShipping
);
router.put(
  "/:id/request-cancelled",
  authMiddleware,
  isShipper,
  orderController.requestCancel
);
router.put(
  "/:id/update-to-completed",
  authMiddleware,
  isUser,
  orderController.confirmReceived
);
module.exports = router;
