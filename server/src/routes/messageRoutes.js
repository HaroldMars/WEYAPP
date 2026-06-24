import express from "express";
import { sendImageMessage } from "../controllers/messageController.js";
import { protect } from "../middleware/auth.js";
import { uploadChatImage } from "../middleware/upload.js";

const router = express.Router();

router.use(protect);

router.post("/image", uploadChatImage.single("image"), sendImageMessage);

export default router;
