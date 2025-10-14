const Post = require("../models/Post");

class PostService {
    static async getAllPosts(query, opts = {}) {
        const { page = 1, limit, search = "" } = query;
        const { includeAll = false } = opts;
        const filter = { title: { $regex: search, $options: "i" } };
        if (!includeAll) filter.isPublished = true;
        let q = Post.find(filter).populate("author", "personalInfo fullName avatar");
        if (limit) q = q.skip((page - 1) * parseInt(limit)).limit(parseInt(limit));
        q = q.sort({ createdAt: -1 });
        return await q;
    }

    static async getPostById(id, opts = {}) {
        const { includeAll = false, preview = false } = opts;
        const post = await Post.findById(id).populate("author", "personalInfo fullName email avatar");
        if (!post) throw new Error("Post not found");
        if (!includeAll && !post.isPublished) throw new Error("Post not found");
        if (!preview) {
        post.views = (post.views || 0) + 1;
        await post.save();
        }
        return post;
    }

    static async getPostBySlug(slug, opts = {}) {
        const { includeAll = false, preview = false } = opts;
        const post = await Post.findOne({ slug }).populate("author", "personalInfo fullName email avatar");
        if (!post) throw new Error("Post not found");
        if (!includeAll && !post.isPublished) throw new Error("Post not found");
        if (!preview) {
        post.views = (post.views || 0) + 1;
        await post.save();
        }
        return post;
    }
}

module.exports = PostService;