const cron = require("node-cron");
const Coupon = require("../models/Coupon");

// Rule cập nhật status
async function updateCouponStatus() {
    const now = new Date();

    try {
        const coupons = await Coupon.find({});

        for (let coupon of coupons) {
        // Nếu đã archived thì bỏ qua
        if (coupon.status === "archived") continue;

        if (coupon.startDate && now < coupon.startDate) {
            coupon.status = "paused";
        } else if (coupon.endDate && now > coupon.endDate) {
            coupon.status = "expired";
        } else {
            coupon.status = "active";
        }

        await coupon.save();
        }

        console.log(`[CouponJob] Updated ${coupons.length} coupons at ${now}`);
    } catch (err) {
        console.error("[CouponJob] Error updating coupons:", err.message);
    }
}

// Cron job chạy mỗi 1 giờ
cron.schedule("0 * * * *", () => {
    updateCouponStatus();
});