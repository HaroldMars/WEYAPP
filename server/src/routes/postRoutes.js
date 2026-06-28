import express from "express";
import {
  createPost,
  listPosts,
  toggleLike,
  addComment,
  deleteComment,
  deletePost,
} from "../controllers/postController.js";
import { protect } from "../middleware/auth.js";
import { uploadPostImage } from "../middleware/upload.js";

const router = express.Router();

router.use(protect);

router.get("/", listPosts);
router.post("/", uploadPostImage.single("image"), createPost);
router.post("/:id/like", toggleLike);
router.post("/:id/comments", addComment);
router.delete("/:id/comments/:commentId", deleteComment);
router.delete("/:id", deletePost);

export default router;
