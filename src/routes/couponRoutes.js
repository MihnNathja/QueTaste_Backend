const express = require("express");
const couponController = require("../controllers/couponController");

const router = express.Router();

// Lấy danh sách coupon
router.get("/", couponController.getAllCoupons);

// Xem chi tiết
router.get("/:id", couponController.getCouponById);

// Tạo mới
router.post("/", couponController.createCoupon);

// Cập nhật
router.patch("/:id", couponController.updateCoupon);

// Tạm dừng
router.patch("/:id/pause", couponController.pauseCoupon);

// Lưu trữ
router.patch("/:id/archive", couponController.archiveCoupon);

// Kích hoạt lại
router.patch("/:id/activate", couponController.activateCoupon);

module.exports = router;