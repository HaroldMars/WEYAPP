import Post from "../models/Post.js";
import { resolveUploadedFileUrl } from "../middleware/upload.js";

const shapePost = (post, viewerId) => ({
  id: post._id,
  author: post.author.toSafeJSON ? post.author.toSafeJSON() : post.author,
  text: post.text,
  image: post.image,
  likeCount: post.likes.length,
  likedByMe: viewerId ? post.likes.some((id) => String(id) === String(viewerId)) : false,
  commentCount: post.comments.length,
  comments: post.comments.map((c) => ({
    id: c._id,
    author: c.author,
    text: c.text,
    createdAt: c.createdAt,
  })),
  createdAt: post.createdAt,
});

// ---------- POST /api/posts ----------
// Create a new post (text and/or image)
export const createPost = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text?.trim() && !req.file) {
      return res.status(400).json({ message: "A post needs text or an image." });
    }

    const imageUrl = req.file ? await resolveUploadedFileUrl(req.file, "post-images") : "";

    const post = await Post.create({
      author: req.user._id,
      text: text?.trim() || "",
      image: imageUrl,
    });

    const populated = await post.populate("author", "-password");

    return res.status(201).json({ post: shapePost(populated, req.user._id) });
  } catch (err) {
    console.error("[posts:create]", err);
    return res.status(500).json({ message: "Something went wrong creating your post." });
  }
};

// ---------- GET /api/posts ----------
// Public feed - everyone's posts, most recent first
export const listPosts = async (req, res) => {
  try {
    const { authorId } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    const query = authorId ? { author: authorId } : {};

    const posts = await Post.find(query)
      .populate("author", "-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      posts: posts.map((p) => shapePost(p, req.user._id)),
      page,
      hasMore: posts.length === limit,
    });
  } catch (err) {
    console.error("[posts:list]", err);
    return res.status(500).json({ message: "Something went wrong fetching posts." });
  }
};

// ---------- POST /api/posts/:id/like ----------
// Toggle like on a post
export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const alreadyLiked = post.likes.some((uid) => String(uid) === String(req.user._id));

    if (alreadyLiked) {
      post.likes = post.likes.filter((uid) => String(uid) !== String(req.user._id));
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();

    return res.status(200).json({
      likeCount: post.likes.length,
      likedByMe: !alreadyLiked,
    });
  } catch (err) {
    console.error("[posts:toggleLike]", err);
    return res.status(500).json({ message: "Something went wrong updating your like." });
  }
};

// ---------- POST /api/posts/:id/comments ----------
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: "Comment text is required." });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    post.comments.push({ author: req.user._id, text: text.trim() });
    await post.save();

    const newComment = post.comments[post.comments.length - 1];

    return res.status(201).json({
      comment: {
        id: newComment._id,
        author: req.user.toSafeJSON(),
        text: newComment.text,
        createdAt: newComment.createdAt,
      },
      commentCount: post.comments.length,
    });
  } catch (err) {
    console.error("[posts:addComment]", err);
    return res.status(500).json({ message: "Something went wrong adding your comment." });
  }
};

// ---------- DELETE /api/posts/:id ----------
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }
    if (String(post.author) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only delete your own posts." });
    }

    await post.deleteOne();

    return res.status(200).json({ message: "Post deleted." });
  } catch (err) {
    console.error("[posts:delete]", err);
    return res.status(500).json({ message: "Something went wrong deleting the post." });
  }
};
