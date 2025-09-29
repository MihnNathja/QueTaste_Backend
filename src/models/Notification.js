const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // null nếu gửi broadcast
    type: { type: String, enum: ["order", "post", "review", "comment", "chat"], required: true },
    message: { type: String, required: true },
    link: { type: String },
    priority: { type: String, enum: ["low", "normal", "high"], default: "normal" },
    isRead: { type: Boolean, default: false },
    seenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
