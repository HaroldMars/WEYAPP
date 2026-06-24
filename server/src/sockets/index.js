import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

// userId -> Set of socket ids (a user can have multiple tabs/devices open)
const onlineUsers = new Map();

const addOnlineSocket = (userId, socketId) => {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
};

const removeOnlineSocket = (userId, socketId) => {
  const set = onlineUsers.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) onlineUsers.delete(userId);
};

const isUserOnline = (userId) => onlineUsers.has(String(userId));

export const initSocket = (httpServer) => {
  const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173").split(",");

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  // ---- Auth middleware for socket handshake ----
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const tokenFromCookie = cookieHeader
        .split("; ")
        .find((c) => c.startsWith("token="))
        ?.split("=")[1];

      const token = socket.handshake.auth?.token || tokenFromCookie;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error("User not found"));

      socket.userId = String(user._id);
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    console.log(`[socket] connected: ${socket.user.name} (${socket.id})`);

    addOnlineSocket(userId, socket.id);

    // Join a personal room so we can target this user directly from anywhere
    socket.join(`user:${userId}`);

    // Mark online + notify others
    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit("user:online", { userId });

    // ---- join a specific conversation room (for typing indicators, etc.) ----
    socket.on("conversation:join", (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("conversation:leave", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // ---- send a text message ----
    socket.on("message:send", async ({ conversationId, text }, callback) => {
      try {
        if (!conversationId || !text?.trim()) {
          return callback?.({ error: "Message text is required." });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.some((p) => String(p) === userId)) {
          return callback?.({ error: "You do not have access to this conversation." });
        }

        const message = await Message.create({
          conversation: conversationId,
          sender: userId,
          text: text.trim(),
          readBy: [userId],
        });

        conversation.lastMessage = message._id;
        await conversation.save();

        const populated = await message.populate("sender", "-password");
        const payload = {
          id: populated._id,
          conversation: populated.conversation,
          sender: populated.sender.toSafeJSON(),
          text: populated.text,
          image: populated.image,
          readBy: populated.readBy,
          createdAt: populated.createdAt,
        };

        // Broadcast to everyone in the conversation room (including sender, for multi-tab sync)
        io.to(`conversation:${conversationId}`).emit("message:new", payload);

        // Also push directly to each participant's personal room in case they
        // haven't "opened" this conversation room yet (so their conversation list updates)
        conversation.participants.forEach((p) => {
          io.to(`user:${p}`).emit("conversation:updated", {
            conversationId,
            lastMessage: payload,
          });
        });

        callback?.({ success: true, message: payload });
      } catch (err) {
        console.error("[socket:message:send]", err);
        callback?.({ error: "Something went wrong sending your message." });
      }
    });

    // ---- broadcast an already-uploaded image message (after REST upload) ----
    socket.on("message:image-sent", ({ conversationId, message }) => {
      if (!conversationId || !message) return;
      io.to(`conversation:${conversationId}`).emit("message:new", message);
    });

    // ---- typing indicators ----
    socket.on("typing:start", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("typing:start", {
        conversationId,
        userId,
      });
    });

    socket.on("typing:stop", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("typing:stop", {
        conversationId,
        userId,
      });
    });

    // ---- mark messages as read ----
    socket.on("message:read", async ({ conversationId }) => {
      try {
        await Message.updateMany(
          { conversation: conversationId, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId } }
        );
        socket.to(`conversation:${conversationId}`).emit("message:read", {
          conversationId,
          userId,
        });
      } catch (err) {
        console.error("[socket:message:read]", err);
      }
    });

    // ---- presence check ----
    socket.on("presence:check", ({ userIds }, callback) => {
      const result = {};
      (userIds || []).forEach((id) => {
        result[id] = isUserOnline(id);
      });
      callback?.(result);
    });

    // ---- disconnect ----
    socket.on("disconnect", async () => {
      removeOnlineSocket(userId, socket.id);
      console.log(`[socket] disconnected: ${socket.user.name} (${socket.id})`);

      // Only mark offline if this was their last active socket/tab
      if (!isUserOnline(userId)) {
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
        io.emit("user:offline", { userId, lastSeen: new Date() });
      }
    });
  });

  return io;
};
