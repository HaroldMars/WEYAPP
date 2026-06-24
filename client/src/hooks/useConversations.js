import { useEffect, useState, useCallback } from "react";
import { conversationApi } from "../api/conversations.js";
import { useSocket } from "../context/SocketContext.jsx";

export const useConversations = () => {
  const { socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await conversationApi.list();
      setConversations(data.conversations);
    } catch (err) {
      console.error("[useConversations] failed to load:", err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Real-time: bump a conversation to the top + update its preview when a new message arrives
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = ({ conversationId, lastMessage }) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conversationId);
        if (idx === -1) {
          // Conversation not in our list yet (e.g. someone just started chatting with us) - refetch
          refresh();
          return prev;
        }
        const updated = [...prev];
        updated[idx] = { ...updated[idx], lastMessage, updatedAt: new Date().toISOString() };
        // Move to top
        const [item] = updated.splice(idx, 1);
        return [item, ...updated];
      });
    };

    socket.on("conversation:updated", handleUpdate);
    return () => socket.off("conversation:updated", handleUpdate);
  }, [socket, refresh]);

  const upsertConversation = useCallback((conversation) => {
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === conversation.id);
      if (exists) return prev;
      return [conversation, ...prev];
    });
  }, []);

  return { conversations, isLoading, refresh, upsertConversation };
};
