const cron = require("node-cron");
const Order = require("../models/Order");

// Chạy mỗi phút
cron.schedule("* * * * *", async () => {
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

  try {
    const orders = await Order.find({
      status: "new",
      createdAt: { $lte: thirtyMinutesAgo },
    });

    for (const order of orders) {
      order.status = "confirmed";
      order.confirmedAt = now;
      await order.save();
      console.log(`Auto-confirmed order ${order._id}`);
    }
  } catch (err) {
    console.error("Auto confirm job error:", err);
  }
});
