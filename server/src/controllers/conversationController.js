import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { getIO } from "../sockets/index.js";
import { resolveUploadedFileUrl } from "../middleware/upload.js";

// ---------- GET /api/conversations ----------
// List all conversations for the logged-in user, sorted by most recent activity
export const listConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate("participants", "-password")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    const shaped = conversations.map((c) => {
      const otherParticipants = c.participants
        .filter((p) => String(p._id) !== String(req.user._id))
        .map((p) => p.toSafeJSON());

      return {
        id: c._id,
        isGroup: c.isGroup,
        groupName: c.groupName,
        groupAvatar: c.groupAvatar,
        createdBy: c.createdBy,
        admins: c.admins,
        participants: otherParticipants,
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
      };
    });

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

// ---------- POST /api/conversations/group ----------
// Create a new group chat with 2+ other friends
export const createGroupConversation = async (req, res) => {
  try {
    const { name, memberIds } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required." });
    }
    if (!Array.isArray(memberIds) || memberIds.length < 2) {
      return res.status(400).json({
        message: "Select at least 2 other friends to start a group.",
      });
    }

    const uniqueMemberIds = [...new Set(memberIds.map(String))].filter(
      (id) => id !== String(req.user._id)
    );

    if (uniqueMemberIds.length < 2) {
      return res.status(400).json({
        message: "Select at least 2 other friends to start a group.",
      });
    }

    const myFriendIds = new Set(req.user.friends.map(String));
    const nonFriend = uniqueMemberIds.find((id) => !myFriendIds.has(id));
    if (nonFriend) {
      return res.status(403).json({
        message: "You can only add friends to a group chat.",
      });
    }

    const conversation = await Conversation.create({
      participants: [req.user._id, ...uniqueMemberIds],
      isGroup: true,
      groupName: name.trim().slice(0, 50),
      createdBy: req.user._id,
      admins: [req.user._id],
    });

    const populated = await conversation.populate("participants", "-password");

    const shaped = {
      id: populated._id,
      isGroup: true,
      groupName: populated.groupName,
      groupAvatar: populated.groupAvatar,
      createdBy: populated.createdBy,
      admins: populated.admins,
      participants: populated.participants
        .filter((p) => String(p._id) !== String(req.user._id))
        .map((p) => p.toSafeJSON()),
      createdAt: populated.createdAt,
    };

    return res.status(201).json({ conversation: shaped });
  } catch (err) {
    console.error("[conversations:createGroup]", err);
    return res.status(500).json({ message: "Something went wrong creating the group." });
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

    const messages = await Message.find({
      conversation: id,
      deletedFor: { $ne: req.user._id },
    })
      .populate("sender", "-password")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      messages: messages.map((m) => ({
        id: m._id,
        conversation: m.conversation,
        sender: m.sender.toSafeJSON(),
        text: m.deletedForEveryone ? "" : m.text,
        image: m.deletedForEveryone ? "" : m.image,
        readBy: m.readBy,
        deletedForEveryone: m.deletedForEveryone,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    console.error("[conversations:getMessages]", err);
    return res.status(500).json({ message: "Something went wrong fetching messages." });
  }
};

// ---------- DELETE /api/conversations/:id/messages/:messageId ----------
// mode: "me" (hide only for the requester) or "everyone" (only the sender can do this)
export const deleteMessage = async (req, res) => {
  try {
    const { id, messageId } = req.params;
    const { mode } = req.body; // "me" | "everyone"

    const message = await Message.findOne({ _id: messageId, conversation: id });
    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }

    if (mode === "everyone") {
      if (String(message.sender) !== String(req.user._id)) {
        return res.status(403).json({ message: "You can only delete your own messages for everyone." });
      }
      message.deletedForEveryone = true;
      message.text = "";
      message.image = "";
      await message.save();

      const io = getIO();
      if (io) {
        io.to(`conversation:${id}`).emit("message:deleted", { conversationId: id, messageId, mode: "everyone" });
      }

      return res.status(200).json({ message: "Message deleted for everyone." });
    }

    // mode "me" (default): hide only for the requester
    if (!message.deletedFor.some((u) => String(u) === String(req.user._id))) {
      message.deletedFor.push(req.user._id);
      await message.save();
    }

    return res.status(200).json({ message: "Message deleted for you." });
  } catch (err) {
    console.error("[conversations:deleteMessage]", err);
    return res.status(500).json({ message: "Something went wrong deleting this message." });
  }
};

// ---------- GET /api/conversations/:id/media ----------
// All images shared in this conversation, most recent first - powers the
// "shared photos" grid shown when viewing a chat's profile/group info.
export const getSharedMedia = async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.participants.some((p) => String(p) === String(req.user._id))) {
      return res.status(403).json({ message: "You do not have access to this conversation." });
    }

    const messages = await Message.find({
      conversation: id,
      image: { $ne: "" },
      deletedForEveryone: { $ne: true },
      deletedFor: { $ne: req.user._id },
    })
      .select("image sender createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      media: messages.map((m) => ({
        id: m._id,
        image: m.image,
        sender: m.sender,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    console.error("[conversations:getSharedMedia]", err);
    return res.status(500).json({ message: "Something went wrong fetching shared photos." });
  }
};

// ---------- GET /api/conversations/:id ----------
// Group details: members, admins, group info
export const getConversationDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findById(id).populate("participants", "-password");
    if (!conversation || !conversation.participants.some((p) => String(p._id) === String(req.user._id))) {
      return res.status(403).json({ message: "You do not have access to this conversation." });
    }

    return res.status(200).json({
      conversation: {
        id: conversation._id,
        isGroup: conversation.isGroup,
        groupName: conversation.groupName,
        groupAvatar: conversation.groupAvatar,
        createdBy: conversation.createdBy,
        admins: conversation.admins,
        members: conversation.participants.map((p) => p.toSafeJSON()),
        createdAt: conversation.createdAt,
      },
    });
  } catch (err) {
    console.error("[conversations:getDetails]", err);
    return res.status(500).json({ message: "Something went wrong fetching group details." });
  }
};

// ---------- PUT /api/conversations/:id/group ----------
// Update group name/avatar - any member can do this
export const updateGroupInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: "Group not found." });
    }
    if (!conversation.participants.some((p) => String(p) === String(req.user._id))) {
      return res.status(403).json({ message: "You are not a member of this group." });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: "Group name cannot be empty." });
      }
      conversation.groupName = name.trim().slice(0, 50);
    }

    if (req.file) {
      conversation.groupAvatar = await resolveUploadedFileUrl(req.file, "group-avatars");
    }

    await conversation.save();

    const io = getIO();
    if (io) {
      conversation.participants.forEach((p) => {
        io.to(`user:${p}`).emit("group:updated", {
          conversationId: id,
          groupName: conversation.groupName,
          groupAvatar: conversation.groupAvatar,
        });
      });
    }

    return res.status(200).json({
      message: "Group info updated.",
      groupName: conversation.groupName,
      groupAvatar: conversation.groupAvatar,
    });
  } catch (err) {
    console.error("[conversations:updateGroupInfo]", err);
    return res.status(500).json({ message: "Something went wrong updating the group." });
  }
};

// ---------- POST /api/conversations/:id/members ----------
// Add a friend to the group - any member can do this
export const addGroupMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: "Group not found." });
    }
    if (!conversation.participants.some((p) => String(p) === String(req.user._id))) {
      return res.status(403).json({ message: "You are not a member of this group." });
    }
    if (conversation.participants.some((p) => String(p) === String(userId))) {
      return res.status(409).json({ message: "This person is already in the group." });
    }

    const isFriend = req.user.friends.some((f) => String(f) === String(userId));
    if (!isFriend) {
      return res.status(403).json({ message: "You can only add your friends to a group." });
    }

    conversation.participants.push(userId);
    await conversation.save();

    const populated = await conversation.populate("participants", "-password");

    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit("group:added", {
        conversationId: id,
        groupName: conversation.groupName,
      });
    }

    return res.status(200).json({
      message: "Member added.",
      members: populated.participants.map((p) => p.toSafeJSON()),
    });
  } catch (err) {
    console.error("[conversations:addMember]", err);
    return res.status(500).json({ message: "Something went wrong adding this member." });
  }
};

// ---------- DELETE /api/conversations/:id/members/:userId ----------
// Kick a member - only the group creator or an admin can do this
export const removeGroupMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: "Group not found." });
    }

    const isCreator = String(conversation.createdBy) === String(req.user._id);
    const isAdmin = conversation.admins.some((a) => String(a) === String(req.user._id));
    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: "Only the group creator or an admin can remove members." });
    }
    if (String(userId) === String(conversation.createdBy)) {
      return res.status(403).json({ message: "The group creator cannot be removed." });
    }

    conversation.participants = conversation.participants.filter(
      (p) => String(p) !== String(userId)
    );
    conversation.admins = conversation.admins.filter((a) => String(a) !== String(userId));
    await conversation.save();

    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit("group:removed", {
        conversationId: id,
        groupName: conversation.groupName,
      });
    }

    return res.status(200).json({ message: "Member removed." });
  } catch (err) {
    console.error("[conversations:removeMember]", err);
    return res.status(500).json({ message: "Something went wrong removing this member." });
  }
};

// ---------- POST /api/conversations/:id/admins/:userId ----------
// Promote a member to admin - only the group creator can do this
export const promoteToAdmin = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: "Group not found." });
    }
    if (String(conversation.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only the group creator can assign admins." });
    }
    if (!conversation.participants.some((p) => String(p) === String(userId))) {
      return res.status(400).json({ message: "This person is not a member of the group." });
    }
    if (conversation.admins.some((a) => String(a) === String(userId))) {
      return res.status(409).json({ message: "This person is already an admin." });
    }

    conversation.admins.push(userId);
    await conversation.save();

    return res.status(200).json({ message: "Member promoted to admin.", admins: conversation.admins });
  } catch (err) {
    console.error("[conversations:promoteAdmin]", err);
    return res.status(500).json({ message: "Something went wrong promoting this member." });
  }
};

// ---------- DELETE /api/conversations/:id/admins/:userId ----------
// Demote an admin back to a regular member - only the group creator can do this
export const demoteAdmin = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: "Group not found." });
    }
    if (String(conversation.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only the group creator can remove admins." });
    }

    conversation.admins = conversation.admins.filter((a) => String(a) !== String(userId));
    await conversation.save();

    return res.status(200).json({ message: "Admin removed.", admins: conversation.admins });
  } catch (err) {
    console.error("[conversations:demoteAdmin]", err);
    return res.status(500).json({ message: "Something went wrong removing this admin." });
  }
};
