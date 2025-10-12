const Order = require("../models/Order");
const dayjs = require("dayjs");

class StatisticsService {
    // Doanh thu theo thời gian
    static async getRevenue(filterType = "month", range) {
        const match = { status: "completed" };

        // Tạo time range filter
        if (range) {
        let start, end;
        if (filterType === "day") {
            start = dayjs(range).startOf("day").toDate();
            end = dayjs(range).endOf("day").toDate();
        } else if (filterType === "month") {
            start = dayjs(range).startOf("month").toDate();
            end = dayjs(range).endOf("month").toDate();
        } else if (filterType === "year") {
            start = dayjs(range).startOf("year").toDate();
            end = dayjs(range).endOf("year").toDate();
        }
        match.createdAt = { $gte: start, $lte: end };
        }

        // Group theo mốc thời gian
        let groupFormat = "%Y-%m-%d"; // default theo ngày
        if (filterType === "year") groupFormat = "%Y-%m";
        if (filterType === "month") groupFormat = "%Y-%m-%d";

        const revenueData = await Order.aggregate([
        { $match: match },
        {
            $group: {
            _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
            revenue: { $sum: "$finalAmount" },
            orderCount: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
        ]);

        const summary = revenueData.reduce(
        (acc, cur) => {
            acc.totalRevenue += cur.revenue;
            acc.totalOrders += cur.orderCount;
            return acc;
        },
        { totalRevenue: 0, totalOrders: 0 }
        );

        return {
        filter: { type: filterType, range },
        data: revenueData.map(d => ({
            time: d._id,
            revenue: d.revenue,
            orderCount: d.orderCount
        })),
        summary
        };
    }

    // Dòng tiền
    static async getCashFlow() {
        const orders = await Order.find();

        let moneyInWallet = 0;
        let moneyPending = 0;

        orders.forEach(order => {
        if (order.status === "completed") {
            if (order.paymentMethod === "cash" && order.paymentStatus === "paid") {
            moneyInWallet += order.finalAmount;
            } else if (order.paymentMethod === "momo" && order.paymentStatus === "paid") {
            moneyInWallet += order.finalAmount;
            }
        }
        if (
            ["shipping", "delivering"].includes(order.status) &&
            order.paymentMethod === "cash" &&
            order.paymentStatus === "pending"
        ) {
            moneyPending += order.finalAmount;
        }
        });

        return { cashFlow: { moneyInWallet, moneyPending } };
    }
}

module.exports = StatisticsService;