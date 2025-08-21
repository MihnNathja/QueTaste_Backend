const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOtp);

router.post("/login", authController.login);
router.post("/refresh", authController.refresh);

router.post("/forgot-password", authController.forgotPassword); // gửi OTP.
router.post("/reset-password", authController.resetPassword); // xác thực OTP, đổi mật khẩu.

module.exports = router;
