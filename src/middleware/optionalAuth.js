const jwt = require("jsonwebtoken");

const optionalAuth = (req, res, next) => {
    const auth = req.headers["authorization"];
    if (!auth) return next();

    const parts = auth.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return next();
    }

    const token = parts[1];
    if (!token) return next();

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (!err && decoded) {
        req.user = decoded;
        }
        return next();
    });
};

module.exports = optionalAuth;