const Coupon = require("../models/Coupon");

class CouponService {
    // List + filter + pagination
    static async getAllCoupons(query) {
        const {
            page = 1,
            limit,
            status,
            search = "",
            sortBy = "createdAt",
            order = "desc",
        } = query;

        const filter = {};
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { code: { $regex: search, $options: "i" } },
            ];
        }

        const dir = order === "asc" ? 1 : -1;
        const sort = { [sortBy]: dir };

        let q = Coupon.find(filter).sort(sort);
        if (limit) q = q.skip((page - 1) * limit).limit(parseInt(limit));

        const [coupons, total] = await Promise.all([q, Coupon.countDocuments(filter),]);

        return {
            coupons,
            total,
            currentPage: parseInt(page),
            totalPage: limit ? Math.ceil(total / limit) : 1,
        };
    }

    // Detail
    static async getCouponById(id) {
        return Coupon.findById(id);
    }

    // Create
    static async createCoupon(payload, userId) {
        // validate type/value
        if (payload.type === "percentage" && (payload.value < 1 || payload.value > 100)) {
            throw new Error("Percentage value must be between 1 and 100");
        }
        if (payload.type === "fixed" && payload.value < 0) {
            throw new Error("Fixed discount must be >= 0");
        }
        if (payload.type === "free_shipping" && payload.value < 0) {
            throw new Error("Free shipping discount must be >= 0");
        }

        // validate date range
        if (payload.startDate && payload.endDate && new Date(payload.endDate) < new Date(payload.startDate)) {
            throw new Error("endDate must be greater than or equal to startDate");
        }

        const coupon = new Coupon({
            ...payload,
            createdBy: userId,
            updatedBy: userId,
        });
        return coupon.save();
    }

    // Update
    static async updateCoupon(id, payload, userId) {
        if (payload.usedCount !== undefined) delete payload.usedCount;
        if (payload.code !== undefined) {
            payload.code = payload.code.toLowerCase(); // normalize
        }

        // validate date range
        if (payload.startDate && payload.endDate && new Date(payload.endDate) < new Date(payload.startDate)) {
            throw new Error("endDate must be greater than or equal to startDate");
        }

        const coupon = await Coupon.findByIdAndUpdate(
            id,
            { ...payload, updatedBy: userId },
            { new: true, runValidators: true }
        );
        return coupon;
    }

    // Change status (pause, archive, activate)
    static async changeStatus(id, status, userId) {
        const coupon = await Coupon.findByIdAndUpdate(
            id,
            { status, updatedBy: userId },
            { new: true }
        );
        return coupon;
    }
}

module.exports = CouponService;