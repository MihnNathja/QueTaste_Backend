const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);
reviewSchema.pre(/^find/, function (next) {
  const q = this.getFilter() || {};

  // ✅ Nếu có includeDeleted: bỏ lọc mặc định
  if (q.includeDeleted) {
    delete q.includeDeleted;
    this.setQuery(q);
    return next(); // dừng luôn, không thêm filter
  }

  // ✅ Nếu chỉ lấy chưa xóa
  if (q.isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }

  next();
});

reviewSchema.pre("countDocuments", function (next) {
  const q = this.getFilter();
  if (!q.includeDeleted && q.isDeleted === undefined) {
    this.where({ isDeleted: false });
  } else {
    delete q.includeDeleted;
  }
  next();
});

module.exports = mongoose.model("Review", reviewSchema);
