const Post = require("../models/Post");

class PostService {
    static async getAllPosts(query) {
        const { page = 1, limit, search = "" } = query;

        let q = Post.find({
            isPublished: true,
            title: { $regex: search, $options: "i" },
        }).populate("author", "personalInfo fullName avatar");

        if (limit) {
            q = q.skip((page - 1) * limit).limit(parseInt(limit));
        }

        q = q.sort({ createdAt: -1 }); // mới nhất lên đầu

        return await q;
    }

    static async getPostById(id){
        const post = await Post.findById(id).populate("author", "personalInfo fullName avatar");

        if(!post || !post.isPublished){
            throw new Error("Post not found");
        }

        // tăng views khi xem
        post.views += 1;
        await post.save();

        return post;
    }

    static async getPostBySlug(slug) {
        const post = await Post.findOne({ slug }).populate("author", "personalInfo fullName email avatar");

        if(!post || !post.isPublished){
            throw new Error("Post not found");
        }

        // tăng views
        post.views += 1;
        await post.save();

        return post;
    }
}

module.exports = PostService;
