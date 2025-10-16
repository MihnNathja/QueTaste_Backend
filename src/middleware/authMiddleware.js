const jwt = require("jsonwebtoken");
const sendResponse = require("../utils/response");

const authMiddleware = (req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);

  // Lấy token từ nhiều nguồn cho chắc
  let raw = req.headers.authorization || req.cookies?.accessToken || "";
  let token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;

  if (!token) return sendResponse(res, 401, false, "No token provided");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    // Hết hạn/không hợp lệ: trả 401
    return sendResponse(res, 401, false, "Token invalid or expired");
  }
};

module.exports = authMiddleware;
