import Post from "../models/Post.js";
import User from "../models/User.js";
import { resolveUploadedFileUrl } from "../middleware/upload.js";

// Builds a Map of userId -> safe user JSON for every comment author + reply author
// on a post, so comments can show real names/avatars without needing Mongoose to
// populate inside a subdocument array (which doesn't support nested population
// the way top-level refs do).
const buildAuthorMap = async (posts) => {
  const ids = new Set();
  posts.forEach((p) => {
    p.comments.forEach((c) => ids.add(String(c.author)));
  });
  if (ids.size === 0) return new Map();

  const users = await User.find({ _id: { $in: [...ids] } });
  const map = new Map();
  users.forEach((u) => map.set(String(u._id), u.toSafeJSON()));
  return map;
};

const shapeComment = (c, authorMap) => ({
  id: c._id,
  author: c.deleted ? null : authorMap.get(String(c.author)) || null,
  text: c.deleted ? "" : c.text,
  parentId: c.parentId || null,
  deleted: c.deleted,
  createdAt: c.createdAt,
});

const shapePost = (post, viewerId, authorMap) => ({
  id: post._id,
  author: post.author.toSafeJSON ? post.author.toSafeJSON() : post.author,
  text: post.text,
  image: post.image,
  likeCount: post.likes.length,
  likedByMe: viewerId ? post.likes.some((id) => String(id) === String(viewerId)) : false,
  commentCount: post.comments.filter((c) => !c.deleted).length,
  comments: post.comments.map((c) => shapeComment(c, authorMap)),
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

    return res.status(201).json({ post: shapePost(populated, req.user._id, new Map()) });
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

    const authorMap = await buildAuthorMap(posts);

    return res.status(200).json({
      posts: posts.map((p) => shapePost(p, req.user._id, authorMap)),
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
// Add a comment, or a reply to an existing comment (pass parentId to reply)
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, parentId } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: "Comment text is required." });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    if (parentId) {
      const parentExists = post.comments.some((c) => String(c._id) === String(parentId));
      if (!parentExists) {
        return res.status(400).json({ message: "The comment you're replying to no longer exists." });
      }
    }

    post.comments.push({
      author: req.user._id,
      text: text.trim(),
      parentId: parentId || null,
    });
    await post.save();

    const newComment = post.comments[post.comments.length - 1];

    return res.status(201).json({
      comment: {
        id: newComment._id,
        author: req.user.toSafeJSON(),
        text: newComment.text,
        parentId: newComment.parentId,
        deleted: false,
        createdAt: newComment.createdAt,
      },
      commentCount: post.comments.filter((c) => !c.deleted).length,
    });
  } catch (err) {
    console.error("[posts:addComment]", err);
    return res.status(500).json({ message: "Something went wrong adding your comment." });
  }
};

// ---------- DELETE /api/posts/:id/comments/:commentId ----------
// Soft-deletes a comment (keeps it as a placeholder so reply threads stay intact).
// Only the comment's author or the post's author can delete it.
export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const comment = post.comments.find((c) => String(c._id) === String(commentId));
    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    const isCommentAuthor = String(comment.author) === String(req.user._id);
    const isPostAuthor = String(post.author) === String(req.user._id);
    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({ message: "You can only delete your own comments." });
    }

    comment.deleted = true;
    await post.save();

    return res.status(200).json({
      message: "Comment deleted.",
      commentCount: post.comments.filter((c) => !c.deleted).length,
    });
  } catch (err) {
    console.error("[posts:deleteComment]", err);
    return res.status(500).json({ message: "Something went wrong deleting the comment." });
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
