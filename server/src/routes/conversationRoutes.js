import express from "express";
import {
  listConversations,
  createOrGetConversation,
  createGroupConversation,
  getMessages,
  deleteMessage,
  getConversationDetails,
  getSharedMedia,
  updateGroupInfo,
  addGroupMember,
  removeGroupMember,
  promoteToAdmin,
  demoteAdmin,
} from "../controllers/conversationController.js";
import { protect } from "../middleware/auth.js";
import { uploadGroupAvatar } from "../middleware/upload.js";

const router = express.Router();

router.use(protect);

router.get("/", listConversations);
router.post("/", createOrGetConversation);
router.post("/group", createGroupConversation);

router.get("/:id", getConversationDetails);
router.get("/:id/media", getSharedMedia);
router.put("/:id/group", uploadGroupAvatar.single("avatar"), updateGroupInfo);
router.post("/:id/members", addGroupMember);
router.delete("/:id/members/:userId", removeGroupMember);
router.post("/:id/admins/:userId", promoteToAdmin);
router.delete("/:id/admins/:userId", demoteAdmin);

router.get("/:id/messages", getMessages);
router.delete("/:id/messages/:messageId", deleteMessage);

export default router;
