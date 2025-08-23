const sendResponse = require("../utils/response");
const User = require("../models/User");

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password -__v");
        return sendResponse(res, 200, true, "User profile retrieved successfully", user);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phone, address, dateOfBirth, gender } = req.body;

    // Build object để update
    const updateData = {};
    if (firstName) updateData["personalInfo.firstName"] = firstName;
    if (lastName) updateData["personalInfo.lastName"] = lastName;
    if (phone) updateData["personalInfo.phone"] = phone;
    if (address) updateData["personalInfo.address"] = address;
    if (dateOfBirth) updateData["personalInfo.dateOfBirth"] = dateOfBirth;
    if (gender) updateData["personalInfo.gender"] = gender;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true } // trả về document đã update
    ).select("-password -__v");

    if (!updatedUser) return sendResponse(res, 404, false, "User not found");

    return sendResponse(res, 200, true, "Profile updated successfully", updatedUser);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};