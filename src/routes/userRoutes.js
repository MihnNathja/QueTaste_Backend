const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/me', userController.getProfile); // lấy thông tin user
router.put('/me/update', userController.updateProfile); // cập nhật thông tin user

module.exports = router;