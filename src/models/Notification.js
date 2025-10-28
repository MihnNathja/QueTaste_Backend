// src/models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // người nhận
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    mentionedUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // người được nhắc đến
    type: {
      type: String,
      enum: ["order", "review", "comment", "chat", "system"],
      required: true,
    },
    message: { type: String, required: true },
    link: { type: String },
    priority: { type: String, enum: ["low", "normal", "high"], default: "normal" },
    isRead: { type: Boolean, default: false },
    seenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
