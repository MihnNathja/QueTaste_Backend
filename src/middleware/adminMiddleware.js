const adminMiddleware = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return sendResponse(res, 403, false, "Require admin role");
    }
    next();
};

module.exports = adminMiddleware;
