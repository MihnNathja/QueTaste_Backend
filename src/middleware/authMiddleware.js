const jwt = require("jsonwebtoken")
const sendResponse = require("../utils/response");

const authMiddleware = (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1]; //Bearer token

    if (!token) return sendResponse(res, 401, false, "No token provided");

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return sendResponse(res, 403, false, "Token invalid");

        req.user = decoded;
        next();
    });
};
module.exports = authMiddleware;