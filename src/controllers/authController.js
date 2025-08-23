const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const User = require("../models/User");
const sendResponse = require("../utils/response");
const generateToken = require("../utils/jwt");

// POST /auth/login
exports.login = async (req, res) =>{
    try{
        const{email, password} = req.body;

        const user = await User.findOne({email});
        if (!user) return sendResponse(res, 404, false, "User not found");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return sendResponse(res, 401, false, "Invalid credentials");

        const {accessToken, refreshToken}= generateToken(user._id);

        return sendResponse(res, 200, true, "Login successful", { accessToken, refreshToken });
    } catch(err){
        return sendResponse(res, 500, false, err.message);
    }
};

// POST /auth/refresh
exports.refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return sendResponse(res, 401, false, "No token provided");

        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
            if (err) return sendResponse(res, 403, false, "Invalid refresh token");

            const accessToken = jwt.sign({id: decoded.id}, process.env.JWT_SECRET, {expiresIn: "15m"});
            return sendResponse(res, 200, true, "Token refreshed successfully", { accessToken });
        });
    } catch (err){
        return sendResponse(res, 500, false, err.message);
    }
}