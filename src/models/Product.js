const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        price: { type: Number, required: true },        // giá gốc
        salePrice: { type: Number, default: 0 },       // giá sale nếu có
        stock: { type: Number, default: 0 },
        category: { type: String, trim: true },
        images: [{ type: String }],                    // array url ảnh
        views: { type: Number, default: 0 },          // lượt xem
        isActive: { type: Boolean, default: true },   // sản phẩm còn bán
    },
    { timestamps: true } // tự động createdAt & updatedAt
);

module.exports = mongoose.model("Product", productSchema);
