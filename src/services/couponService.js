const mongoose = require("mongoose");
const Coupon = require("../models/Coupon");
const UserCoupon = require("../models/UserCoupon");
const PointTransaction = require("../models/PointTransaction");

class CouponService {
    // List + filter + pagination
    static async getAdminCoupons(query) {
        const { page = 1, limit, search = "", sortBy = "createdAt", order = "desc" } = query;
        const filter = {};

        if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { code: { $regex: search, $options: "i" } },
        ];
        }

        const sort = { [sortBy]: order === "asc" ? 1 : -1 };
        let q = Coupon.find(filter).sort(sort);
        if (limit) q = q.skip((page - 1) * limit).limit(parseInt(limit));

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

    // User: lấy coupon public + private được cấp
    static async getUserCoupons(query) {
        const { page = 1, limit } = query;
        const now = new Date();

        const filter = {
            status: "active",
            $and: [
            { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
            { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
            ],
        };

        let q = Coupon.find(filter).sort({ createdAt: -1 });
        if (limit) q = q.skip((page - 1) * limit).limit(parseInt(limit));

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

    static async redeemCoupon({ userId, couponId }) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
        const now = new Date();

        // 1) Lấy coupon gốc (chỉ cho phép đổi coupon private, đang active, còn hạn campaign)
        const coupon = await Coupon.findOne({
            _id: couponId,
            visibility: "private",
            status: "active",
            $and: [
            { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
            { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
            ],
        })
            .session(session)
            .exec();

        if (!coupon) throw new Error("Coupon không khả dụng để đổi");

        // 2) Xác định cost điểm để đổi
        // - Nếu bạn thêm field coupon.redeemCost: dùng nó
        // - Nếu chưa có: TỰ quy ước tạm (vd 100 điểm), hoặc throw
        const cost = coupon.redeemCost ?? null;
        if (cost == null || cost <= 0) {
            throw new Error("Coupon chưa cấu hình điểm để đổi (redeemCost)");
        }

        // (Tuỳ chọn) chặn đổi nếu “kho đổi” đã hết
        if (coupon.redeemStock != null) {
            if ((coupon.redeemedCount || 0) >= coupon.redeemStock) {
            throw new Error("Số lượng coupon để đổi đã hết");
            }
        }

        // (Tuỳ chọn) chặn nếu user đã có 1 bản UserCoupon còn hạn cho coupon này (tránh ôm hàng)
        // const existing = await UserCoupon.exists({
        //   userId, couponId, status: "active",
        //   $or: [{ endDate: null }, { endDate: { $gte: now } }],
        // }).session(session);
        // if (existing) throw new Error("Bạn đã sở hữu coupon này, hãy dùng trước khi đổi thêm");

        // 3) Lấy các earn-logs còn hạn & còn remaining > 0 (FEFO)
        const earnLogs = await PointTransaction.find({
            userId,
            type: "earn",
            remaining: { $gt: 0 },
            $or: [{ expireAt: null }, { expireAt: { $gte: now } }],
        })
            .sort({ expireAt: 1, createdAt: 1 })
            .session(session);

        let available = 0;
        for (const l of earnLogs) available += l.remaining;
        if (available < cost) throw new Error("Điểm không đủ để đổi coupon");

        // 4) Trừ điểm theo FEFO
        let need = cost;
        for (const log of earnLogs) {
            if (need <= 0) break;
            const take = Math.min(log.remaining, need);
            if (take > 0) {
            await PointTransaction.updateOne(
                { _id: log._id },
                { $inc: { remaining: -take } },
                { session }
            );
            need -= take;
            }
        }
        if (need > 0) throw new Error("Không thể trừ điểm (race condition?)");

        // Ghi 1 transaction spend (để audit)
        await PointTransaction.create(
            [
            {
                userId,
                type: "spend",
                amount: -cost,
                remaining: 0,
                description: `Redeem coupon ${coupon.code || coupon.name} (${coupon._id})`,
            },
            ],
            { session }
        );

        // 5) Tính hạn dùng của UserCoupon
        // - Nếu set coupon.redeemTtlDays => endDate = min(coupon.endDate, now + TTL)
        // - Nếu KHÔNG set redeemTtlDays => endDate = coupon.endDate (đúng mong muốn của bạn)
        let endDate = coupon.endDate || null;
        if (coupon.redeemTtlDays != null) {
            const ttlMs = coupon.redeemTtlDays * 24 * 60 * 60 * 1000;
            const candidate = new Date(now.getTime() + ttlMs);
            endDate = endDate
            ? new Date(Math.min(endDate.getTime(), candidate.getTime()))
            : candidate;
        }
        const startDate = now;

        // 6) Tạo UserCoupon
        const [userCoupon] = await UserCoupon.create(
            [
            {
                userId,
                couponId: coupon._id,
                status: "active",
                startDate,
                endDate,
            },
            ],
            { session }
        );

        // 7) (Tuỳ chọn) tăng redeemedCount nếu bật kho đổi
        if (coupon.redeemStock != null) {
            const upd = await Coupon.updateOne(
            {
                _id: coupon._id,
                $expr: { $lt: ["$redeemedCount", "$redeemStock"] },
            },
            { $inc: { redeemedCount: 1 } },
            { session }
            );
            if (upd.modifiedCount === 0) {
            throw new Error("Số lượng đổi đã hết (race condition)");
            }
        }

        await session.commitTransaction();
        session.endSession();
        return userCoupon;
        } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
        }
    }

    static async getMyCoupons(userId) {
        const now = new Date();

        const userCoupons = await UserCoupon.find({
        userId,
        status: "active",
        $or: [{ endDate: null }, { endDate: { $gte: now } }],
        })
        .populate("couponId")
        .sort({ createdAt: -1 });

        return userCoupons.map((uc) => {
        const coupon = uc.couponId;
        return {
            id: uc._id,
            status: uc.status,
            usedAt: uc.usedAt,
            startDate: uc.startDate,
            endDate: uc.endDate,
            coupon: coupon
            ? {
                id: coupon._id,
                name: coupon.name,
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                description: coupon.description,
                }
            : null,
        };
        });
    }
}

module.exports = CouponService;