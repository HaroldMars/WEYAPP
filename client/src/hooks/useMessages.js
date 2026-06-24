import { useEffect, useState, useCallback, useRef } from "react";
import { conversationApi } from "../api/conversations.js";
import { useSocket } from "../context/SocketContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export const useMessages = (conversationId) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUserId, setTypingUserId] = useState(null);
  const typingTimeoutRef = useRef(null);

  // Load message history + join the conversation's socket room
  useEffect(() => {
    if (!conversationId) return;

    setIsLoading(true);
    conversationApi
      .getMessages(conversationId)
      .then((data) => setMessages(data.messages))
      .catch((err) => console.error("[useMessages] failed to load:", err.message))
      .finally(() => setIsLoading(false));

    socket?.emit("conversation:join", conversationId);
    socket?.emit("message:read", { conversationId });

    return () => {
      socket?.emit("conversation:leave", conversationId);
    };
  }, [conversationId, socket]);

  // Listen for new real-time messages in this conversation
  useEffect(() => {
    if (!socket) return;

    const handleNew = (message) => {
      if (String(message.conversation) !== String(conversationId)) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      // If the message isn't from us, mark it read since we have this conversation open
      if (String(message.sender.id) !== String(user?.id)) {
        socket.emit("message:read", { conversationId });
      }
    };

    const handleTypingStart = ({ conversationId: cId, userId }) => {
      if (String(cId) !== String(conversationId)) return;
      setTypingUserId(userId);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTypingUserId(null), 3000);
    };

    const handleTypingStop = ({ conversationId: cId }) => {
      if (String(cId) !== String(conversationId)) return;
      setTypingUserId(null);
    };

    socket.on("message:new", handleNew);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);

    return () => {
      socket.off("message:new", handleNew);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, conversationId, user?.id]);

  const sendText = useCallback(
    (text) => {
      if (!text.trim() || !socket || !conversationId) return Promise.resolve();
      return new Promise((resolve, reject) => {
        socket.emit("message:send", { conversationId, text }, (response) => {
          if (response?.error) reject(new Error(response.error));
          else resolve(response.message);
        });
      });
    },
    [socket, conversationId]
  );

  const appendImageMessage = useCallback(
    (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      socket?.emit("message:image-sent", { conversationId, message });
    },
    [socket, conversationId]
  );

  const notifyTyping = useCallback(() => {
    socket?.emit("typing:start", { conversationId });
  }, [socket, conversationId]);

  const notifyStopTyping = useCallback(() => {
    socket?.emit("typing:stop", { conversationId });
  }, [socket, conversationId]);

  return {
    messages,
    isLoading,
    typingUserId,
    sendText,
    appendImageMessage,
    notifyTyping,
    notifyStopTyping,
  };
};
