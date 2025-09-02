const express = require("express");
const postController = require("../controllers/postController");

const router = express.Router();

// Lấy tất cả bài viết
router.get("/", postController.getAllPosts);

// Lấy chi tiết 1 bài viết
router.get("/:slug", postController.getPostBySlug);

module.exports = router;
