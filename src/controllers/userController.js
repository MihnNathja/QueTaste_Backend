const sendResponse = require("../utils/response");
const cloudinary = require("../config/cloudinary"); // config Cloudinary
const User = require("../models/User");

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password -__v");
        return sendResponse(res, 200, true, "User profile retrieved successfully", user);
    } catch (err) {
        console.log(err);
        return sendResponse(res, 500, false, err.message);
    }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, phone, address, dateOfBirth, gender } = req.body;

    const updateData = {};

    if (fullName) updateData["personalInfo.fullName"] = fullName;
    if (phone) updateData["personalInfo.phone"] = phone;
    if (address) updateData["personalInfo.address"] = address;
    if (dateOfBirth) updateData["personalInfo.dateOfBirth"] = dateOfBirth;
    if (gender) updateData["personalInfo.gender"] = gender;

    // Nếu có file avatar được upload
    if (req.file) {
      // Upload lên Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "avatars",
        width: 300,
        height: 300,
        crop: "fill",
      });
      updateData.avatar = result.secure_url; // lưu URL avatar vào DB
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true } // trả về document đã update
    ).select("-password -__v");

    //console.log(updatedUser);
    if (!updatedUser) return sendResponse(res, 404, false, "User not found");

    return sendResponse(res, 200, true, "Profile updated successfully", updatedUser);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};
