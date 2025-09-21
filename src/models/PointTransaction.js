const mongoose = require("mongoose");

const pointTransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true }, // điểm gốc được cộng
    remaining: { type: Number, required: true }, // điểm còn lại chưa dùng
    type: { type: String, enum: ["earn", "spend", "expire"], required: true },
    description: String,
    expireAt: Date,
}, { timestamps: true });

module.exports = mongoose.model("PointTransaction", pointTransactionSchema);