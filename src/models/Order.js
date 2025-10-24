const mongoose = require("mongoose");

const ORDER_STATUS = [
  "new", // Đơn hàng mới
  "confirmed", // Đã xác nhận
  "shipping", // Đang vận chuyển
  "done_shipping", // Hoàn thành giao hàng
  "completed", // Hoàn tất đơn hàng
  "cancelled", // Đã hủy
  "cancel_requested", // Khách yêu cầu hủy
  "shipper_cancel_requested", // Shipper yêu cầu hủy
  "refund", // Hoàn trả / hoàn tiền
];

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1 },
        price: { type: Number, required: true }, // giá bán tại thời điểm đặt
        isReviewed: { type: Boolean, default: false },
      },
    ],
    //status: { type: String, enum: ["pending", "completed", "canceled"], default: "pending" },
    status: {
      type: String,
      enum: ORDER_STATUS,
      default: "new",
    },
    cancelRequest: {
      reason: String,
      requestedAt: Date,
    },
    // Thanh toán
    paymentMethod: { type: String, default: "cash" },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    // Giao hàng
    shippingAddress: {
      fullName: String,
      phone: String,
      address: String,
      city: String,
      postalCode: String,
    },
    shippingFee: { type: Number, default: 0 },
    //deliveryStatus: { type: String, enum: ["pending", "shipping", "delivered", "canceled"], default: "pending" },

    // Tổng tiền
    totalAmount: { type: Number, required: true }, // tổng tiền trước giảm
    discount: { type: Number, default: 0 }, // tổng giảm
    finalAmount: { type: Number, required: true }, // tiền khách phải trả = totalAmount - discount + shippingFee

    // Coupon được áp dụng
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },

    // Ghi chú
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
