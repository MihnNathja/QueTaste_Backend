const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
    const accessToken = jwt.sign({id: userId}, process.env.JWT_SECRET, {expiresIn: "15m"});
    const refreshToken = jwt.sign({id: userId}, process.env.JWT_REFRESH_SECRET, {expiresIn: "7d"});
    return {accessToken, refreshToken};
const generateToken = (user) => {
    const payload = {
        id: user._id,
        role: user.role
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
    return { accessToken, refreshToken };
};

module.exports = generateToken;