const mongoose = require("mongoose");

const userCouponSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", required: true },

    // trạng thái sử dụng
    status: { type: String, enum: ["active", "used", "expired"], default: "active" },
    usedAt: { type: Date },

    // hạn dùng cho coupon này (riêng từng user)
    startDate: { type: Date },
    endDate: { type: Date },

}, { timestamps: true });

module.exports = mongoose.model("UserCoupon", userCouponSchema);