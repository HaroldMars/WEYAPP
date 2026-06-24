import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { resolveUploadedFileUrl } from "../middleware/upload.js";

// ---------- POST /api/messages/image ----------
// Uploads an image and creates a message record. The actual real-time broadcast
// to the other participant happens via Socket.IO, triggered from the client after
// this returns (see client SocketContext) so that REST and sockets share one source of truth.
export const sendImageMessage = async (req, res) => {
  try {
    const { conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({ message: "conversationId is required." });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No image file was provided." });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.some((p) => String(p) === String(req.user._id))) {
      return res.status(403).json({ message: "You do not have access to this conversation." });
    }

    const imageUrl = await resolveUploadedFileUrl(req.file, "chat-images");

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      image: imageUrl,
      readBy: [req.user._id],
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    const populated = await message.populate("sender", "-password");

    return res.status(201).json({
      message: {
        id: populated._id,
        conversation: populated.conversation,
        sender: populated.sender.toSafeJSON(),
        text: populated.text,
        image: populated.image,
        readBy: populated.readBy,
        createdAt: populated.createdAt,
      },
    });
  } catch (err) {
    console.error("[messages:sendImage]", err);
    return res.status(500).json({ message: "Something went wrong sending your image." });
  }
};
