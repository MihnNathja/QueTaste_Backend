const mongoose = require("mongoose");

const COUPON_TYPES = [
    "percentage",   // giảm theo %
    "fixed",        // giảm số tiền cố định
    "free_shipping" // miễn phí hoặc trần phí ship
];

const COUPON_STATUS = [
    "active",       // đang hoạt động
    "paused",       // tạm dừng thủ công
    "expired",      // hết hạn theo endDate
    "archived"      // đã lưu trữ / ẩn
];

const couponSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },          // tên hiển thị trong admin
    code: { type: String, unique: true, sparse: true },          // mã nhập, có thể null nếu chỉ dùng campaign
    description: { type: String, trim: true },                   // mô tả ngắn gọn (nội bộ)

    type: { type: String, enum: COUPON_TYPES, required: true },  // loại giảm
    value: { type: Number, required: true },                     // % hoặc số tiền
    maxDiscount: { type: Number },                               // trần giảm tối đa (khi type=percentage)

    // Điều kiện áp dụng
    minOrderValue: { type: Number, default: 0 },                 // đơn tối thiểu

    // Giới hạn
    usageLimit: { type: Number },        // tổng số lượt được dùng
    usagePerCustomer: { type: Number, default: null },  // số lần / khách, null = không giới hạn
    usedCount: { type: Number, default: 0 },

    // Thời gian
    startDate: { type: Date },
    endDate: { type: Date },

    // Chỉ áp dụng vào ngày trong tuần (0=CN, 1=T2,...,6=T7)
    daysOfWeek: [{ type: Number }],

    // Trạng thái & điều khiển
    status: { type: String, enum: COUPON_STATUS, default: "active" },

    // Audit log cơ bản
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

}, { timestamps: true });

module.exports = mongoose.model("Coupon", couponSchema);