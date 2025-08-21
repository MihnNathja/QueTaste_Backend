const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/me', userController.getMe); // lấy thông tin user
router.put('/me/update', userController.getUpdateMe); // cập nhật thông tin user
