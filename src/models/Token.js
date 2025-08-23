const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  refreshToken: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: "7d" } // auto delete sau 7 ngày
});

module.exports = mongoose.model("Token", tokenSchema);