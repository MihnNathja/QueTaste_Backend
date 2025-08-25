const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware')
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // temp folder


router.get('/me', authMiddleware, userController.getProfile); // lấy thông tin user
router.put("/me/update", authMiddleware, upload.single("avatar"), userController.updateProfile); // cập nhật thông tin user

module.exports = router;