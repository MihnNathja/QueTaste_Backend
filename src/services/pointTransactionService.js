const PointTransaction = require("../models/PointTransaction");
const User = require("../models/User");

async function earnPoints(userId, amount, description, expireDays = 365) {
    const expireAt = new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000);

    await PointTransaction.create({
        userId,
        amount,
        remaining: amount,
        type: "earn",
        description,
        expireAt
    });

    await User.findByIdAndUpdate(userId, { $inc: { pointsBalance: amount } });
}

async function spendPoints(userId, amount, description) {
    let needToSpend = amount;

    // lấy các transaction earn chưa hết hạn, còn remaining
    const earns = await PointTransaction.find({
        userId,
        type: "earn",
        remaining: { $gt: 0 },
        expireAt: { $gt: new Date() }
    }).sort({ expireAt: 1, createdAt: 1 }); // FIFO

    for (const earn of earns) {
        if (needToSpend <= 0) break;

        const deduct = Math.min(earn.remaining, needToSpend);
        earn.remaining -= deduct;
        needToSpend -= deduct;
        await earn.save();
    }

    if (needToSpend > 0) {
        throw new Error("Not enough points");
    }

    await PointTransaction.create({
        userId,
        amount: -amount,
        remaining: 0,
        type: "spend",
        description
    });

    await User.findByIdAndUpdate(userId, { $inc: { pointsBalance: -amount } });
}

async function getPointHistory(userId) {
    return await PointTransaction.find({ userId }).sort({ createdAt: -1 });
}

module.exports = { earnPoints, spendPoints, getPointHistory };
