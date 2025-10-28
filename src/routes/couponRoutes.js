// routes/couponRoutes.js
const express = require("express");
const couponController = require("../controllers/couponController");
const auth = require("../../src/middleware/authMiddleware");

const router = express.Router();

router.get("/my", auth, couponController.getMyCoupons);       // coupon user đã redeem
router.get("/user", auth, couponController.getUserCoupons);   // coupon user có thể dùng
router.post("/:id/redeem", auth, couponController.redeemCoupon);

router.get("/admin", auth, couponController.getAdminCoupons);

router.get("/:id", couponController.getCouponById);
router.post("/", couponController.createCoupon);
router.patch("/:id", couponController.updateCoupon);
router.patch("/:id/pause", couponController.pauseCoupon);
router.patch("/:id/archive", couponController.archiveCoupon);
router.patch("/:id/activate", couponController.activateCoupon);

module.exports = router;