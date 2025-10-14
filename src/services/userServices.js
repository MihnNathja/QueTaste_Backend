const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

const getProfile = async (userId) => {
  return await User.findById(userId).select("-password -__v");
};

const updateProfile = async (userId, body, file) => {
  const { fullName, phone, shippingAddress, dateOfBirth, gender } = body;
  const updateData = {};

  if (fullName) updateData["personalInfo.fullName"] = fullName;
  if (phone) updateData["personalInfo.phone"] = phone;
  if (dateOfBirth) updateData["personalInfo.dateOfBirth"] = dateOfBirth;
  if (gender) updateData["personalInfo.gender"] = gender;

  if (shippingAddress) {
    try {
      const parsedAddress = JSON.parse(shippingAddress);
      updateData["personalInfo.shippingAddress"] = parsedAddress;
    } catch (err) {
      console.error("❌ Lỗi parse shippingAddress:", err);
    }
  }

  if (file) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "avatars",
      width: 300,
      height: 300,
      crop: "fill",
    });
    updateData.avatar = result.secure_url;
  }

  return await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true }
  ).select("-password -__v");
};

const searchUsers = async (keyword) => {
  const filter = {};

  if (keyword) {
    filter["personalInfo.fullName"] = { $regex: keyword, $options: "i" };
  }

  return await User.find(filter).select(
    "_id avatar role personalInfo.fullName"
  );
};

module.exports = {
  getProfile,
  updateProfile,
  searchUsers,
};
