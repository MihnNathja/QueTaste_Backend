const express = require("express");
const { register, verifyOtp } = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);

module.exports = router;
