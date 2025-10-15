const sendResponse = require("../utils/response");
const userService = require("../services/userServices");

exports.getProfile = async (req, res) => {
  try {
    const user = await userService.getProfile(req.user.id);
    if (!user) return sendResponse(res, 404, false, "User not found");
    return sendResponse(res, 200, true, "User profile retrieved successfully", user);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    console.log(req.body);
    const updatedUser = await userService.updateProfile(req.user.id, req.body, req.file);
    if (!updatedUser) return sendResponse(res, 404, false, "User not found");
    return sendResponse(res, 200, true, "Profile updated successfully", updatedUser);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const users = await userService.searchUsers(q);
    return sendResponse(res, 200, true, "Users fetched", users);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};
