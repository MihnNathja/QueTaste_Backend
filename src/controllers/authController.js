const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Otp = require("../models/Otp");
const sendMail = require("../utils/sendMail");

// Helper: random OTP 6 số
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// 📍 Đăng ký (Register)
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // check email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // tạo user mới (chưa verify)
        const user = await User.create({
        name,
        email,
        password: hashedPassword,
        isVerified: false,
        });

        // tạo otp
        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

        await Otp.create({ email, otp, expiresAt });

        // gửi mail
        await sendMail(email, "Xác thực tài khoản", `Mã OTP của bạn là: ${otp}`);

        res.status(201).json({ message: "User registered. OTP sent to email." });
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

        // update user
        await User.updateOne({ email }, { $set: { isVerified: true } });

        // xóa otp
        await Otp.deleteOne({ _id: record._id });

        res.json({ message: "Account verified successfully" });
    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
