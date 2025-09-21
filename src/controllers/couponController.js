const sendResponse = require("../utils/response");
const CouponService = require("../services/couponService");

// Admin: lấy toàn bộ coupon
exports.getAdminCoupons = async (req, res) => {
    try {
        const coupons = await CouponService.getAdminCoupons(req.query);
        return sendResponse(res, 200, true, "Coupons fetched", coupons);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

// User: chỉ lấy coupon có thể dùng (public + private assigned)
exports.getUserCoupons = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return sendResponse(res, 401, false, "Unauthorized");

        const coupons = await CouponService.getUserCoupons(req.query, userId);
        return sendResponse(res, 200, true, "Coupons fetched", coupons);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

// GET /coupons/:id
exports.getCouponById = async (req, res) => {
    try {
        const coupon = await CouponService.getCouponById(req.params.id);
        if (!coupon) {
            return sendResponse(res, 404, false, "Coupon not found");
        }
        return sendResponse(res, 200, true, "Coupon fetched", coupon);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

// POST /coupons
exports.createCoupon = async (req, res) => {
    try {
        const coupon = await CouponService.createCoupon(req.body, req.user?._id);
        return sendResponse(res, 201, true, "Coupon created", coupon);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

// PATCH /coupons/:id
exports.updateCoupon = async (req, res) => {
    try {
        const coupon = await CouponService.updateCoupon(req.params.id, req.body, req.user?._id);
        if (!coupon) {
            return sendResponse(res, 404, false, "Coupon not found");
        }
        return sendResponse(res, 200, true, "Coupon updated", coupon);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

// PATCH /coupons/:id/pause
exports.pauseCoupon = async (req, res) => {
    try {
        const coupon = await CouponService.changeStatus(req.params.id, "paused", req.user?._id);
        if (!coupon) {
            return sendResponse(res, 404, false, "Coupon not found");
        }
        return sendResponse(res, 200, true, "Coupon paused", coupon);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

// PATCH /coupons/:id/archive
exports.archiveCoupon = async (req, res) => {
    try {
        const coupon = await CouponService.changeStatus(req.params.id, "archived", req.user?._id);
        if (!coupon) {
            return sendResponse(res, 404, false, "Coupon not found");
        }
        return sendResponse(res, 200, true, "Coupon archived", coupon);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

// PATCH /coupons/:id/activate
exports.activateCoupon = async (req, res) => {
    try {
        const coupon = await CouponService.changeStatus(req.params.id, "active", req.user?._id);
        if (!coupon) {
            return sendResponse(res, 404, false, "Coupon not found");
        }
        return sendResponse(res, 200, true, "Coupon activated", coupon);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

// POST /coupons/:id/redeem
exports.redeemCoupon = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return sendResponse(res, 401, false, "Unauthorized");

        const userCoupon = await CouponService.redeemCoupon({
        userId,
        couponId: req.params.id,
        });

        return sendResponse(res, 201, true, "Coupon redeemed", userCoupon);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

// GET /coupons/my
exports.getMyCoupons = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return sendResponse(res, 401, false, "Unauthorized");

        const coupons = await CouponService.getMyCoupons(userId);
        return sendResponse(res, 200, true, "User coupons fetched", coupons);
    } catch (err) {
        console.error("Error in getMyCoupons:", err);
        return sendResponse(res, 400, false, err.message);
    }
};