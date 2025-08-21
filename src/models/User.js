// src/models/User.js
const mongoose = require("mongoose");

const personalInfoSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  phone: { type: String },
  address: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ["male", "female"] },
}, { _id: false });  // không tạo _id riêng cho object nhúng

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  personalInfo: personalInfoSchema,
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
