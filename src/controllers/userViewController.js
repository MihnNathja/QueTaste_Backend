const UserViewService = require("../services/userViewService");
const sendResponse = require("../utils/response");

exports.addView = async (req, res) => {
  try {
    await UserViewService.addView(req.user.id, req.params.productId);
    return sendResponse(res, 201, true, "Product view recorded");
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

exports.getRecentViews = async (req, res) => {
  try {
    const views = await UserViewService.getRecentViews(req.user.id, req.query.limit);
    return sendResponse(res, 200, true, "Recent viewed products fetched", views);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};
