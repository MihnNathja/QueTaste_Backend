const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const User = require("../models/User");
const Otp = require("../models/Otp");
const sendResponse = require("../utils/response");
const sendOtpMail = require("../utils/sendMail");

// Tao token
const generateToken = (userId) => {
    const accessToken = jwt.sign({id: userId}, process.env.JWT_SECRET, {expiresIn: "15m"});
    const refreshToken = jwt.sign({id: userId}, process.env.JWT_REFRESH_SECRET, {expiresIn: "7d"});
    return {accessToken, refreshToken};
};

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
        const { token } = req.body;
        if (!token) return sendResponse(res, 401, false, "No token provided");

        jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
            if (err) return sendResponse(res, 403, false, "Invalid refresh token");

            const accessToken = jwt.sign({id: decaded.id}, process.env.JWT_SECRET, {expiresIn: "15m"});
            return sendResponse(res, 200, true, "Token refreshed successfully", { accessToken });
        });
    } catch (err){
        return sendResponse(res, 500, false, err.message);
    }
}

// Helper: random OTP 6 s?
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ?? Ðang ký (Register ho?c Resend OTP n?u chua verify)
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        // Case 1: User dã t?n t?i & verified
        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // Case 2: User chua t?n t?i ? t?o user m?i
        if (!existingUser) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await User.create({
                name,
                email,
                password: hashedPassword,
                isVerified: false,
            });
        }

        // Case 3: User dã t?n t?i nhung chua verify
        const existingOtp = await Otp.findOne({ email }).sort({ createdAt: -1 });

        if (existingOtp && existingOtp.expiresAt > Date.now()) {
            // OTP còn h?n ? không g?i m?i
            return res.status(400).json({
                message: "OTP has already been sent. Please check your email.",
                expiresAt: existingOtp.expiresAt,
            });
        }

        // N?u không có OTP ho?c dã h?t h?n ? t?o m?i
        await Otp.deleteMany({ email });

        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 1 * 60 * 1000);

        await Otp.create({ email, otp, expiresAt });

        await sendOtpMail(email, otp);

        // Tr? v? khác nhau cho rõ nghia
        if (existingUser) {
            return res.status(200).json({ message: "OTP resent to your email" });
        } else {
            return res.status(201).json({ message: "User registered. OTP sent to email." });
        }

    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ?? Xác th?c OTP
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const record = await Otp.findOne({ email, otp });
        if (!record) {
        return res.status(400).json({ message: "Invalid OTP" });
        }

        if (record.expiresAt < Date.now()) {
        return res.status(400).json({ message: "OTP expired" });
        }

        // Update user verified
        await User.updateOne({ email }, { $set: { isVerified: true } });

        // Xoá OTP sau khi dùng
        await Otp.deleteOne({ _id: record._id });

        res.json({ message: "Account verified successfully" });
    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
