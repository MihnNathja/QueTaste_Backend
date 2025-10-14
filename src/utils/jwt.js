const jwt = require("jsonwebtoken");

const generateToken = (user) => {
    const payload = {
        id: user._id,
        role: user.role
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
    return { accessToken, refreshToken };
};

module.exports = generateToken;