const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

const getProfile = async (userId) => {
  return await User.findById(userId).select("-password -__v");
};

const updateProfile = async (userId, body, file) => {
  const { fullName, phone, address, dateOfBirth, gender } = body;
  const updateData = {};

  if (fullName) updateData["personalInfo.fullName"] = fullName;
  if (phone) updateData["personalInfo.phone"] = phone;
  if (address) updateData["personalInfo.address"] = address;
  if (dateOfBirth) updateData["personalInfo.dateOfBirth"] = dateOfBirth;
  if (gender) updateData["personalInfo.gender"] = gender;

  if (file) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "avatars",
      width: 300,
      height: 300,
      crop: "fill",
    });
    updateData.avatar = result.secure_url;
  }

  return await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).select(
    "-password -__v"
  );
};

const searchUsers = async (keyword, role) => {
  const filter = {};

  if (keyword) {
    filter["personalInfo.fullName"] = { $regex: keyword, $options: "i" };
  }
  if (role) {
    filter.role = role;
  }

  return await User.find(filter).select("_id avatar role personalInfo.fullName");
};

module.exports = {
  getProfile,
  updateProfile,
  searchUsers,
};
