const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const User = require("../models/User");
const sendResponse = require("../utils/response");
const generateToken = require("../utils/jwt");
const AuthService = require("../services/authService");

// POST /auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const tokens = await AuthService.login(email, password);
        return sendResponse(res, 200, true, "Login successful", tokens);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

// POST /auth/refresh
exports.refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return sendResponse(res, 401, false, "No token provided");
        const result = await AuthService.refresh(token);
        return sendResponse(res, 200, true, "Token refreshed successfully", result);
    } catch (err) {
        return sendResponse(res, 403, false, err.message);
    }
};

// POST /auth/logout
exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) return sendResponse(res, 400, false, "No refresh token provided");

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const result = await AuthService.logout(decoded.id, refreshToken);
        
        return sendResponse(res, 200, true, result.message);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

// POST /auth/register
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const result = await AuthService.register(name, email, password);

        if (result.resend) {
            return sendResponse(res, 200, true, "OTP resent to your email");
        } else {
            return sendResponse(res, 201, true, "User registered. OTP sent to email.");
        }
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

// POST /auth/verify-otp
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        await AuthService.verifyOtp(email, otp);
        return sendResponse(res, 200, true, "Account verified successfully");
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

// POST /auth/forgot-password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await AuthService.forgotPassword(email);
        return sendResponse(res, 200, true, result.message);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};

// POST /auth/reset-password
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const result = await AuthService.resetPassword(email, otp, newPassword);
        return sendResponse(res, 200, true, result.message);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
};
