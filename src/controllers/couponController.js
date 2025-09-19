const sendResponse = require("../utils/response");
const CouponService = require("../services/couponService");

// GET /coupons
exports.getAllCoupons = async (req, res) => {
    try {
        const coupons = await CouponService.getAllCoupons(req.query);
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