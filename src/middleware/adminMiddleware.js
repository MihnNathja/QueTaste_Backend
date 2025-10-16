const sendResponse = require("../utils/response");
const adminMiddleware = (req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);
  if (req.user?.role !== "admin") {
    return sendResponse(res, 403, false, "Require admin role");
  }
  next();
};
module.exports = adminMiddleware;
