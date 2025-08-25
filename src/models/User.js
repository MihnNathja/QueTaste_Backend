const mongoose = require("mongoose");

// Schema chứa thông tin cá nhân
const personalInfoSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"], default: "other" },
  },
  { _id: false } // nhúng vào userSchema, không tạo _id riêng
);

// Schema chính User
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    avatar: {
      type: String, // lưu URL hoặc path tới ảnh
      default: "", // nếu rỗng thì frontend sẽ dùng default avatar
    },
    status: {
      type: String,
      enum: ["active", "inactive", "banned"],
      default: "active",
    },
    personalInfo: personalInfoSchema, // nhúng schema cá nhân
  },
  { timestamps: true } // tự động tạo createdAt, updatedAt
);

module.exports = mongoose.model("User", userSchema);
