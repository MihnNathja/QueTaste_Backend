const sendResponse = require("../utils/response");
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
        const { token } = req.body;
        if (!token) return sendResponse(res, 401, false, "No token provided");
        const result = await AuthService.refresh(token);
        return sendResponse(res, 200, true, "Token refreshed successfully", result);
    } catch (err) {
        return sendResponse(res, 403, false, err.message);
    }
};

// POST /auth/register
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const result = await AuthService.register(name, email, password);
    
        if (result.resend) {
            return res.status(200).json({ message: "OTP resent to your email" });
        } else {
            return res.status(201).json({ message: "User registered. OTP sent to email." });
        }
        } catch (err) {
            return res.status(400).json({ message: err.message });
        }
    };
    
// POST /auth/verify-otp
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        await AuthService.verifyOtp(email, otp);
        res.json({ message: "Account verified successfully" });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
