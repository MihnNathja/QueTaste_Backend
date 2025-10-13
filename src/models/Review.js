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

  // Nếu không yêu cầu includeDeleted và chưa chỉ định isDeleted cụ thể
  if (!q.includeDeleted && q.isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }

  // Luôn xóa flag includeDeleted để không xuống DB
  if (q.includeDeleted !== undefined) {
    delete q.includeDeleted;
    this.setQuery(q); // ✅ Cập nhật lại filter cho mongoose
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

reviewSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};
module.exports = mongoose.model("Review", reviewSchema);
