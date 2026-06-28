import express from "express";
import {
  listConversations,
  createOrGetConversation,
  createGroupConversation,
  getMessages,
} from "../controllers/conversationController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", listConversations);
router.post("/", createOrGetConversation);
router.post("/group", createGroupConversation);
router.get("/:id/messages", getMessages);

export default router;
