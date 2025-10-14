const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Post = require("../models/Post");

const EXCLUDED_STATUS = ["cancelled", "refund", "cancel_requested"];
const PAID_MATCH = { paymentStatus: "paid", status: { $nin: EXCLUDED_STATUS } };

const safeInt = (v, def) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : def;
};

const toUtcDate = (y, m, d = 1) => new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

function monthRange(year, month) {
    const start = toUtcDate(year, month, 1);
    const end = toUtcDate(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1, 1);
    return { start, end };
}
function quarterRange(year, quarter) {
    const startMonth = (quarter - 1) * 3 + 1;
    const start = toUtcDate(year, startMonth, 1);
    const end = toUtcDate(startMonth + 3 > 12 ? year + 1 : year, ((startMonth + 3 - 1) % 12) + 1, 1);
    return { start, end };
}
function prevMonth(year, month) {
    return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}
function prevQuarter(year, quarter) {
    return quarter === 1 ? { year: year - 1, quarter: 4 } : { year, quarter: quarter - 1 };
}

async function seriesByMonth(year, month, metric) {
    const { start, end } = monthRange(year, month);
    const agg = await Order.aggregate([
        { $match: { ...PAID_MATCH, createdAt: { $gte: start, $lt: end } } },
        {
        $project: {
            day: { $dayOfMonth: "$createdAt" },
            value: metric === "orders" ? 1 : "$finalAmount",
        },
        },
        { $group: { _id: "$day", total: { $sum: "$value" } } },
        { $sort: { _id: 1 } },
    ]);
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const map = new Map(agg.map((x) => [x._id, x.total]));
    const out = [];
    for (let d = 1; d <= daysInMonth; d++) out.push({ x: d, v: map.get(d) || 0 });
    return out;
}

async function seriesByQuarter(year, quarter, metric) {
    const { start, end } = quarterRange(year, quarter);
    const agg = await Order.aggregate([
        { $match: { ...PAID_MATCH, createdAt: { $gte: start, $lt: end } } },
        {
        $project: {
            week: { $isoWeek: "$createdAt" },
            year: { $isoWeekYear: "$createdAt" },
            value: metric === "orders" ? 1 : "$finalAmount",
        },
        },
        { $group: { _id: { y: "$year", w: "$week" }, total: { $sum: "$value" } } },
        { $sort: { "_id.y": 1, "_id.w": 1 } },
    ]);
    const list = agg.map((r) => r.total);
    return Array.from({ length: 13 }, (_, i) => ({ x: i + 1, v: list[i] || 0 }));
}

function mergeDays(a, b, c) {
    const len = Math.max(a.length, b.length, c.length);
    const out = [];
    for (let i = 0; i < len; i++) {
        out.push({
        day: i + 1,
        cur: a[i]?.v || 0,
        prev: b[i]?.v ?? (b[b.length - 1]?.v || 0),
        last: c[i]?.v ?? (c[c.length - 1]?.v || 0),
        });
    }
    return out;
}
function mergeWeeks(a, b) {
    const len = Math.max(a.length, b.length);
    const out = [];
    for (let i = 0; i < len; i++) {
        out.push({
        week: i + 1,
        cur: a[i]?.v || 0,
        prev: b[i]?.v ?? (b[b.length - 1]?.v || 0),
        });
    }
    return out;
}

class StatisticsService {
    static async getSummary() {
        const [productCount, userCount, revenueAgg] = await Promise.all([
        Product.countDocuments({ isActive: true }),
        User.countDocuments({}),
        Order.aggregate([
            { $match: PAID_MATCH },
            { $group: { _id: null, revenue: { $sum: "$finalAmount" }, orders: { $sum: 1 } } },
        ]),
        ]);

        const revenue = revenueAgg[0]?.revenue || 0;
        const profit = Math.round(revenue * 0.2);

        return {
        products: productCount,
        users: userCount,
        revenue,
        profit,
        };
    }

    static async getCompare(query) {
        const scope = query.scope === "quarter" ? "quarter" : "month";
        const metric = query.metric === "orders" ? "orders" : "revenue";
        const now = new Date();
        const year = safeInt(query.year, now.getUTCFullYear());

        if (scope === "month") {
        const month = safeInt(query.month, now.getUTCMonth() + 1);
        const { year: py, month: pm } = prevMonth(year, month);
        const lastYear = year - 1;

        const [cur, prev, last] = await Promise.all([
            seriesByMonth(year, month, metric),
            seriesByMonth(py, pm, metric),
            seriesByMonth(lastYear, month, metric),
        ]);

        return {
            xKey: "day",
            series: [
            { key: "cur", name: `Tháng ${month} năm ${year}`, color: "#4F46E5" },
            { key: "prev", name: `Tháng ${pm} năm ${py}`, color: "#06B6D4" },
            { key: "last", name: `Tháng ${month} năm ${lastYear}`, color: "#22C55E" },
            ],
            data: mergeDays(cur, prev, last),
            subtitle: `Tháng ${month} năm ${year} (so với Tháng ${pm} năm ${py} & Tháng ${month} năm ${lastYear})`,
        };
        }

        const quarter = safeInt(query.quarter, 1);
        const { year: py, quarter: pq } = prevQuarter(year, quarter);

        const [cur, prev] = await Promise.all([
        seriesByQuarter(year, quarter, metric),
        seriesByQuarter(py, pq, metric),
        ]);

        return {
        xKey: "week",
        series: [
            { key: "cur", name: `Quý ${quarter} năm ${year}`, color: "#4F46E5" },
            { key: "prev", name: `Quý ${pq} năm ${py}`, color: "#06B6D4" },
        ],
        data: mergeWeeks(cur, prev),
        subtitle: `Quý ${quarter} năm ${year} (so với Quý ${pq} năm ${py})`,
        };
    }

    static async getWeeklyProfit() {
        const now = new Date();
        const dow = now.getUTCDay();
        const diffToMon = (dow + 6) % 7;
        const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMon));
        const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 7));

        const agg = await Order.aggregate([
        { $match: { ...PAID_MATCH, createdAt: { $gte: start, $lt: end } } },
        { $group: { _id: null, revenue: { $sum: "$finalAmount" } } },
        ]);

        const revenue = agg[0]?.revenue || 0;
        const profit = Math.round(revenue * 0.2);

        return { weekStart: start, weekEnd: end, revenue, profit };
    }

    static async getOrderStatus() {
        const rows = await Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        ]);

        const map = new Map(rows.map((r) => [r._id, r.count]));
        const data = [
        { name: "new", value: map.get("new") || 0 },
        { name: "confirmed", value: map.get("confirmed") || 0 },
        { name: "shipping", value: map.get("shipping") || 0 },
        { name: "completed", value: map.get("completed") || 0 },
        { name: "cancelled", value: map.get("cancelled") || 0 },
        ];

        return { data, raw: rows };
    }

    static async getTopProducts(query) {
        const limit = safeInt(query.limit, 5);
        const from = query.from ? new Date(query.from) : new Date(0);
        const to = query.to ? new Date(query.to) : new Date();

        const rows = await Order.aggregate([
        { $match: { ...PAID_MATCH, createdAt: { $gte: from, $lt: to } } },
        { $unwind: "$items" },
        {
            $group: {
            _id: "$items.product",
            sold: { $sum: "$items.quantity" },
            },
        },
        { $sort: { sold: -1 } },
        { $limit: limit },
        {
            $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
            },
        },
        { $unwind: "$product" },
        { $project: { _id: 0, productId: "$product._id", name: "$product.name", sold: 1 } },
        ]);

        return { data: rows };
    }

    static async getNewCustomers(query) {
        const months = safeInt(query.months, 3);
        const now = new Date();
        const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));

        const rows = await User.aggregate([
        { $match: { createdAt: { $gte: start, $lte: now } } },
        {
            $group: {
            _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
            users: { $sum: 1 },
            },
        },
        { $sort: { "_id.y": 1, "_id.m": 1 } },
        ]);

        const monthNames = ["Thg 1", "Thg 2", "Thg 3", "Thg 4", "Thg 5", "Thg 6", "Thg 7", "Thg 8", "Thg 9", "Thg 10", "Thg 11", "Thg 12"];

        const seq = [];
        for (let i = months - 1; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
        seq.push({ y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 });
        }
        const map = new Map(rows.map((r) => [`${r._id.y}-${r._id.m}`, r.users]));
        const data = seq.map(({ y, m }) => ({ label: monthNames[m - 1], users: map.get(`${y}-${m}`) || 0 }));

        return { data };
    }

    static async getUserRegistrationsByDay(query) {
        const now = new Date();
        const year = safeInt(query.year, now.getUTCFullYear());
        const month = safeInt(query.month, now.getUTCMonth() + 1);
        const { start, end } = monthRange(year, month);

        const agg = await User.aggregate([
            { $match: { createdAt: { $gte: start, $lt: end } } },
            { $project: { d: { $dayOfMonth: "$createdAt" } } },
            { $group: { _id: "$d", users: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);

        const dim = new Date(Date.UTC(year, month, 0)).getUTCDate();
        const map = new Map(agg.map((x) => [x._id, x.users]));
        const data = Array.from({ length: dim }, (_, i) => ({ day: i + 1, users: map.get(i + 1) || 0 }));
        return { year, month, data };
    }

    static async getTopSpenders(query) {
        const limit = safeInt(query.limit, 3);
        const from = query.from ? new Date(query.from) : new Date(0);
        const to = query.to ? new Date(query.to) : new Date();

        const rows = await Order.aggregate([
            { $match: { ...PAID_MATCH, createdAt: { $gte: from, $lt: to } } },
            { $group: { _id: "$user", totalSpend: { $sum: "$finalAmount" }, orders: { $sum: 1 } } },
            { $sort: { totalSpend: -1 } },
            { $limit: limit },
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
            { $unwind: "$user" },
            {
                $project: {
                _id: 0,
                id: "$user._id",
                name: "$user.personalInfo.fullName",
                email: "$user.email",
                avatar: "$user.avatar",
                totalSpend: 1,
                orders: 1,
                memberSince: "$user.createdAt",
                },
            },
        ]);

        return { data: rows };
    }

    static async getBuyerRatio(query) {
        const now = new Date();
        const year = safeInt(query.year, now.getUTCFullYear());
        const startYear = toUtcDate(year, 1, 1);
        const endYear = toUtcDate(year + 1, 1, 1);

        const regs = await User.aggregate([
            { $match: { createdAt: { $gte: startYear, $lt: endYear } } },
            { $group: { _id: { m: { $month: "$createdAt" } }, registered: { $sum: 1 } } },
            { $sort: { "_id.m": 1 } },
        ]);

        const buyers = await Order.aggregate([
            { $match: { ...PAID_MATCH, createdAt: { $gte: startYear, $lt: endYear } } },
            { $group: { _id: { m: { $month: "$createdAt" }, user: "$user" } } },
            { $group: { _id: { m: "$_id.m" }, buyers: { $sum: 1 } } },
            { $sort: { "_id.m": 1 } },
        ]);

        const regMap = new Map(regs.map((r) => [r._id.m, r.registered]));
        const buyMap = new Map(buyers.map((b) => [b._id.m, b.buyers]));

        const data = Array.from({ length: 12 }, (_, i) => {
            const m = i + 1;
            const registered = regMap.get(m) || 0;
            const b = Math.min(buyMap.get(m) || 0, registered);
            const non = Math.max(registered - b, 0);
            return { month: m, buyers: b, nonBuyers: non };
        });

        return { year, data };
    }

    static async getAllUsers(query) {
        const page = safeInt(query.page, 1);
        const limit = safeInt(query.limit, 20);
        const search = query.search?.trim();
        const role = query.role?.trim();
        const status = query.status?.trim();

        const filter = {};
        if (search) {
            filter.$or = [
            { "personalInfo.fullName": { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            ];
        }
        if (role) filter.role = role;
        if (status) filter.status = status;

        // total để tính phân trang
        const total = await User.countDocuments(filter);

        const items = await User.aggregate([
            { $match: filter },
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
            // kéo số liệu đơn hàng sang, xử lý cả user | userId & string | ObjectId
            $lookup: {
                from: "orders",
                let: { uid: "$_id" },
                pipeline: [
                {
                    $match: {
                    paymentStatus: "paid",
                    status: { $nin: EXCLUDED_STATUS },
                    $expr: {
                        $or: [
                        // Nếu Order.user là ObjectId
                        { $eq: ["$user", "$$uid"] },
                        // Nếu Order.user là string
                        { $eq: [{ $toObjectId: "$user" }, "$$uid"] },
                        // Nếu Order.userId là ObjectId
                        { $eq: ["$userId", "$$uid"] },
                        // Nếu Order.userId là string
                        { $eq: [{ $toObjectId: "$userId" }, "$$uid"] },
                        ],
                    },
                    },
                },
                {
                    $group: {
                    _id: null,
                    totalSpend: { $sum: "$finalAmount" },
                    orders: { $sum: 1 },
                    },
                },
                ],
                as: "orderStats",
            },
            },
            {
            $addFields: {
                totalSpend: { $ifNull: [{ $arrayElemAt: ["$orderStats.totalSpend", 0] }, 0] },
                orders: { $ifNull: [{ $arrayElemAt: ["$orderStats.orders", 0] }, 0] },
            },
            },
            {
            $project: {
                _id: 1,
                email: 1,
                role: 1,
                status: 1,
                avatar: 1,
                createdAt: 1,
                "personalInfo.fullName": 1,
                totalSpend: 1,
                orders: 1,
            },
            },
        ]);

        return {
            items,
            pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            },
        };
        }

    static async getUserById(id) {
        return await User.findById(id).select("-password -__v");
    }

    static async getPostsViewsTotal() {
        const agg = await Post.aggregate([
            { $group: { _id: null, totalViews: { $sum: { $ifNull: ["$views", 0] } } } },
        ]);
        return { totalViews: agg[0]?.totalViews || 0 };
    }

    static async getTopPosts(query) {
        const limit = safeInt(query.limit, 5);
        const rows = await Post.find({})
            .sort({ views: -1, updatedAt: -1 })
            .limit(limit)
            .select("_id title slug category views updatedAt")
            .lean();
        return { items: rows };
    }

    static async updatePostBySlug(slug, body) {
        const {
            title,
            summary,
            contentBlocks,
            coverImage,
            category,
            tags,
            isPublished,
            newSlug,
        } = body || {};

        const update = {};
        if (title !== undefined) update.title = title;
        if (summary !== undefined) update.summary = summary;
        if (Array.isArray(contentBlocks)) update.contentBlocks = contentBlocks;
        if (coverImage !== undefined) update.coverImage = coverImage;
        if (category !== undefined) update.category = category;
        if (Array.isArray(tags)) update.tags = tags;
        if (typeof isPublished === "boolean") update.isPublished = isPublished;
        if (newSlug && typeof newSlug === "string" && newSlug.trim()) update.slug = newSlug.trim();

        const updated = await Post.findOneAndUpdate(
            { slug },
            { $set: update },
            { new: true }
        )
            .populate("author", "personalInfo email avatar")
            .select("-__v");

        return updated;
    }

    static async lockPostBySlug(slug, locked) {
        const isPublished = locked ? false : true;
        const updated = await Post.findOneAndUpdate(
            { slug },
            { $set: { isPublished } },
            { new: true }
        )
            .populate("author", "personalInfo email avatar")
            .select("-__v");

        return updated;
    }
}

module.exports = StatisticsService;