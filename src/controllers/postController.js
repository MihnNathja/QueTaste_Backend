const sendResponse = require("../utils/response");
const PostService = require("../services/postService");

// GET /post
exports.getAllPosts = async (req, res) => {
    try {
        const posts = await PostService.getAllPosts(req.query);
        return sendResponse(res, 200, true, "All posts fetched", posts);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

// GET /post/:slug
exports.getPostBySlug = async (req, res) => {
    try {
        const post = await PostService.getPostBySlug(req.params.slug);
        return sendResponse(res, 200, true, "Post fetched", post);
    } catch(err){
        return sendResponse(res, 404, false, err.message);
    }
};

