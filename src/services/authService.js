const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const Otp = require("../models/Otp");
const sendOtpMail = require("../utils/sendMail");
const generateToken = require("../utils/jwt")
const Token = require("../models/Token");

// Helper: random OTP 6 số
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

class AuthService {
    static async login(email, password) {
        const user = await User.findOne({ email });
        if (!user) throw new Error("User not found");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error("Invalid credentials");

        const tokens = generateToken(user._id);

        await Token.create({ userId: user._id, refreshToken: tokens.refreshToken });

        return tokens;
    }

    static async refresh(token) {
        return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
            if (err) return reject(new Error("Invalid refresh token"));
                const accessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
                resolve({ accessToken });
            });
        });
    }

    static async logout(userId, refreshToken) {
        const deleted = await Token.findOneAndDelete({ userId, refreshToken });
        if (!deleted) throw new Error("Invalid token or already logged out");
        return { message: "Logout successful" };
    }

    static async register(name, email, password) {
        const existingUser = await User.findOne({ email });

        if (existingUser && existingUser.isVerified) {
            throw new Error("Email already registered");
        }

        if (!existingUser) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await User.create({
                email,
                password: hashedPassword,
                isVerified: false, // bạn đã set đúng
                role: "user",      // default, có thể bỏ nếu muốn
                avatar: "",        // để rỗng
                status: "active",  // default
                personalInfo: {
                    fullName: name || "",  // thay name vào fullName
                    phone: "",
                    address: "",
                    dateOfBirth: null,
                    gender: "other",
                },
            });
        }

        const existingOtp = await Otp.findOne({ email }).sort({ createdAt: -1 });

        if (existingOtp && existingOtp.expiresAt > Date.now()) {
            return { resend: true, expiresAt: existingOtp.expiresAt };
        }

        await Otp.deleteMany({ email });

        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 1 * 60 * 1000);

        await Otp.create({ email, otp, expiresAt });
        await sendOtpMail(email, otp);

        return { resend: !!existingUser };
    }

    static async verifyOtp(email, otp) {
        const record = await Otp.findOne({ email, otp });
        if (!record) throw new Error("Invalid OTP");
        if (record.expiresAt < Date.now()) throw new Error("OTP expired");

        await User.updateOne({ email }, { $set: { isVerified: true } });
        await Otp.deleteOne({ _id: record._id });

        return true;
    }

    static async forgotPassword(email) {
        const user = await User.findOne({ email });
        if (!user) throw new Error("User not found");

        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 phút

        await Otp.create({ email, otp, expiresAt });
        await sendOtpMail(email, otp);

        return { message: "OTP sent to your email" };
    }

    static async resetPassword(email, otp, newPassword) {
        const record = await Otp.findOne({ email, otp });
        if (!record) throw new Error("Invalid OTP");
        if (record.expiresAt < Date.now()) throw new Error("OTP expired");

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updateOne({ email }, { $set: { password: hashedPassword } });
        await Otp.deleteOne({ _id: record._id });

        return { message: "Password reset successfully" };
    }

}

module.exports = AuthService;
