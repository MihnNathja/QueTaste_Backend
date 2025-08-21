const express = require("express");
const { register, verifyOtp } = require("../controllers/authController");
const {login, refresh} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);

router.post("/login",login);
router.post("/refresh", refresh);

module.exports = router;
