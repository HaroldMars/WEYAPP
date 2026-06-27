import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

// ---------- GET /api/conversations ----------
// List all conversations for the logged-in user, sorted by most recent activity
export const listConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate("participants", "-password")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    const shaped = conversations.map((c) => ({
      id: c._id,
      isGroup: c.isGroup,
      groupName: c.groupName,
      participants: c.participants
        .filter((p) => String(p._id) !== String(req.user._id))
        .map((p) => p.toSafeJSON()),
      lastMessage: c.lastMessage
        ? {
            id: c.lastMessage._id,
            text: c.lastMessage.text,
            image: c.lastMessage.image,
            sender: c.lastMessage.sender,
            createdAt: c.lastMessage.createdAt,
          }
        : null,
      updatedAt: c.updatedAt,
    }));

    return res.status(200).json({ conversations: shaped });
  } catch (err) {
    console.error("[conversations:list]", err);
    return res.status(500).json({ message: "Something went wrong fetching your conversations." });
  }
};

// ---------- POST /api/conversations ----------
// Start (or fetch existing) 1:1 conversation with another user
export const createOrGetConversation = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }
    if (userId === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot start a conversation with yourself." });
    }

    const isFriend = req.user.friends.some((f) => String(f) === String(userId));
    if (!isFriend) {
      return res.status(403).json({
        message: "You can only message people you're friends with. Send a friend request first.",
      });
    }

    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, userId], $size: 2 },
    }).populate("participants", "-password");

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, userId],
        isGroup: false,
      });
      conversation = await conversation.populate("participants", "-password");
    }

    const shaped = {
      id: conversation._id,
      isGroup: conversation.isGroup,
      participants: conversation.participants
        .filter((p) => String(p._id) !== String(req.user._id))
        .map((p) => p.toSafeJSON()),
      createdAt: conversation.createdAt,
    };

    return res.status(200).json({ conversation: shaped });
  } catch (err) {
    console.error("[conversations:createOrGet]", err);
    return res.status(500).json({ message: "Something went wrong starting this conversation." });
  }
};

// ---------- GET /api/conversations/:id/messages ----------
export const getMessages = async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.participants.some((p) => String(p) === String(req.user._id))) {
      return res.status(403).json({ message: "You do not have access to this conversation." });
    }

    const messages = await Message.find({ conversation: id })
      .populate("sender", "-password")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      messages: messages.map((m) => ({
        id: m._id,
        conversation: m.conversation,
        sender: m.sender.toSafeJSON(),
        text: m.text,
        image: m.image,
        readBy: m.readBy,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    console.error("[conversations:getMessages]", err);
    return res.status(500).json({ message: "Something went wrong fetching messages." });
  }
};
