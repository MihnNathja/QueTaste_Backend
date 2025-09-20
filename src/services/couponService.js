const Coupon = require("../models/Coupon");
const UserCoupon = require("../models/UserCoupon");

class CouponService {
    // List + filter + pagination
    static async getAllCoupons(query, userRole = "customer", userId = null) {
        const {
            page = 1,
            limit,
            status,
            search = "",
            sortBy = "createdAt",
            order = "desc",
        } = query;

        const filter = {};
        const andConditions = [];

        // Lọc theo status
        if (status) {
            filter.status = status;
        }

        // Lọc theo search (name/code)
        if (search) {
            andConditions.push({
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { code: { $regex: search, $options: "i" } },
                ],
            });
        }

        // Nếu là user (khách) thì chỉ thấy public hoặc private được cấp qua UserCoupon
        if (userRole === "customer" && userId) {
            const userCoupons = await UserCoupon.find({
                userId,
                status: "active",
            }).select("couponId");

            const userCouponIds = userCoupons.map((uc) => uc.couponId);

            andConditions.push({
                $or: [
                    { visibility: "public" },
                    { _id: { $in: userCouponIds } },
                ],
            });

            // Coupon còn trong khoảng thời gian hiệu lực
            const now = new Date();
            andConditions.push(
                {
                    $or: [
                        { startDate: null },
                        { startDate: { $lte: now } },
                    ],
                },
                {
                    $or: [
                        { endDate: null },
                        { endDate: { $gte: now } },
                    ],
                }
            );
        }

        // Nếu có nhiều điều kiện thì combine bằng $and
        if (andConditions.length > 0) {
            filter.$and = andConditions;
        }

        // Sort
        const dir = order === "asc" ? 1 : -1;
        const sort = { [sortBy]: dir };

        // Query
        let q = Coupon.find(filter).sort(sort);
        if (limit) {
            q = q.skip((page - 1) * limit).limit(parseInt(limit));
        }

        const [coupons, total] = await Promise.all([
            q,
            Coupon.countDocuments(filter),
        ]);

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