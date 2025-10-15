const express = require("express");
const postController = require("../controllers/postController");
const optionalAuth = require("../middleware/optionalAuth");

const router = express.Router();

router.get("/", optionalAuth, postController.getAllPosts);
router.get("/:slug", optionalAuth, postController.getPostBySlug);

module.exports = router;