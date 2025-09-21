const express = require("express");
const userViewController = require("../controllers/userViewController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/:productId", userViewController.addView);
router.get("/recent", userViewController.getRecentViews);

module.exports = router;
