import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users } from "lucide-react";
import ConversationListItem from "../components/ConversationListItem.jsx";
import FriendRequestBanner from "../components/FriendRequestBanner.jsx";
import { useConversations } from "../hooks/useConversations.js";
import { useSocket } from "../context/SocketContext.jsx";
import { friendApi } from "../api/friends.js";

export default function ChatPage() {
  const { conversations, isLoading } = useConversations();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [incomingRequests, setIncomingRequests] = useState([]);

  const loadRequests = useCallback(async () => {
    try {
      const data = await friendApi.listIncomingRequests();
      setIncomingRequests(data.requests);
    } catch (err) {
      console.error("Failed to load friend requests:", err.message);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Real-time: a new request arrives while we're online
  useEffect(() => {
    if (!socket) return;
    const handleNewRequest = (request) => {
      setIncomingRequests((prev) => [request, ...prev]);
    };
    socket.on("friend:request-received", handleNewRequest);
    return () => socket.off("friend:request-received", handleNewRequest);
  }, [socket]);

  const handleRequestHandled = (requestId) => {
    setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const filteredConversations = conversations.filter((c) => {
    if (!search.trim()) return true;
    const peer = c.participants[0];
    if (!peer) return false;
    const q = search.toLowerCase();
    return peer.name.toLowerCase().includes(q) || peer.nickname?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-full bg-paper-50 px-4 py-4 flex flex-col gap-4">
      <h1 className="font-display font-bold text-xl text-ink-900 px-1">WEYAPP!</h1>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink-900/35" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          className="w-full pl-11 pr-4 py-3 rounded-full bg-ink-900/[0.06] text-sm text-ink-900
            placeholder:text-ink-900/40 outline-none focus:bg-ink-900/[0.08] transition-colors"
        />
      </div>

      {incomingRequests.length > 0 && (
        <div className="bg-white rounded-xl2 shadow-bubble overflow-hidden">
          <p className="text-xs font-semibold text-ink-900/50 px-3 pt-3 pb-1">Friend Request</p>
          <div className="divide-y divide-ink-900/[0.05]">
            {incomingRequests.map((r) => (
              <FriendRequestBanner key={r.id} request={r} onHandled={handleRequestHandled} />
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-1 animate-pulse">
              <div className="w-11 h-11 rounded-full bg-ink-900/5" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-ink-900/5 rounded w-2/3" />
                <div className="h-2.5 bg-ink-900/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center text-center px-6 py-16 gap-3">
          <div className="w-12 h-12 rounded-full bg-signal-500/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-signal-500" />
          </div>
          <p className="text-sm text-ink-900/50">
            {conversations.length === 0
              ? "No conversations yet. Add a friend to start chatting."
              : "No chats match your search."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {filteredConversations.map((c) => (
            <ConversationListItem
              key={c.id}
              conversation={c}
              isActive={false}
              onClick={() => navigate(`/chat/${c.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
