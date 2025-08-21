const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Otp = require("../models/Otp");
const sendOtpMail = require("../utils/sendMail");

// Helper: random OTP 6 số
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// 📍 Đăng ký (Register hoặc Resend OTP nếu chưa verify)
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        // Case 1: User đã tồn tại & verified
        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // Case 2: User chưa tồn tại → tạo user mới
        if (!existingUser) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await User.create({
                name,
                email,
                password: hashedPassword,
                isVerified: false,
            });
        }

        // Case 3: User đã tồn tại nhưng chưa verify
        const existingOtp = await Otp.findOne({ email }).sort({ createdAt: -1 });

        if (existingOtp && existingOtp.expiresAt > Date.now()) {
            // OTP còn hạn → không gửi mới
            return res.status(400).json({
                message: "OTP has already been sent. Please check your email.",
                expiresAt: existingOtp.expiresAt,
            });
        }

        // Nếu không có OTP hoặc đã hết hạn → tạo mới
        await Otp.deleteMany({ email });

        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 1 * 60 * 1000);

        await Otp.create({ email, otp, expiresAt });

        await sendOtpMail(email, otp);

        // Trả về khác nhau cho rõ nghĩa
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

// 📍 Xác thực OTP
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
