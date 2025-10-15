const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, unique: true, trim: true },
        summary: { type: String, trim: true },
        contentBlocks: [
            {
                type: { type: String, enum: ["text", "image"], required: true },
                text: { type: String },      // dùng khi block là text
                image: { type: String },     // dùng khi block là image
                caption: { type: String },   // caption cho ảnh (không bắt buộc)
            },
        ],

        coverImage: { type: String },

        author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        category: { type: String, trim: true },
        tags: [{ type: String, trim: true }],

        views: { type: Number, default: 0 },
        isPublished: { type: Boolean, default: false },

        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);