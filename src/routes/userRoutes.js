const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

router.get("/me", authMiddleware, userController.getProfile);
router.put("/me/update", authMiddleware, upload.single("avatar"), userController.updateProfile);

router.get("/search", authMiddleware, userController.searchUsers);

module.exports = router;
