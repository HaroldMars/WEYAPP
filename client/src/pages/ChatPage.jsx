import { useState } from "react";
import { Plus, MessageCircleMore } from "lucide-react";
import NavRail from "../components/NavRail.jsx";
import ConversationListItem from "../components/ConversationListItem.jsx";
import NewChatModal from "../components/NewChatModal.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import { useConversations } from "../hooks/useConversations.js";
import { conversationApi } from "../api/conversations.js";

export default function ChatPage() {
  const { conversations, isLoading, upsertConversation } = useConversations();
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const handleSelectUser = async (user) => {
    setShowNewChatModal(false);
    try {
      const data = await conversationApi.createOrGet(user.id);
      upsertConversation(data.conversation);
      setActiveConversationId(data.conversation.id);
    } catch (err) {
      console.error("Failed to start conversation:", err.message);
    }
  };

  return (
    <div className="h-screen flex bg-paper-50">
      <NavRail />

      {/* Sidebar */}
      <div className="w-80 shrink-0 border-r border-ink-900/[0.06] flex flex-col">
        <div className="flex items-center justify-between px-5 py-5">
          <h1 className="font-display font-bold text-xl text-ink-900">Chats</h1>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="w-9 h-9 rounded-xl bg-signal-500/10 text-signal-500 flex items-center justify-center hover:bg-signal-500/20 transition-colors"
            aria-label="New conversation"
          >
            <Plus className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {isLoading ? (
            <div className="px-3 py-2 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-11 h-11 rounded-full bg-ink-900/5" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-ink-900/5 rounded w-2/3" />
                    <div className="h-2.5 bg-ink-900/5 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center text-center px-6 py-12 gap-3">
              <div className="w-12 h-12 rounded-full bg-signal-500/10 flex items-center justify-center">
                <MessageCircleMore className="w-6 h-6 text-signal-500" />
              </div>
              <p className="text-sm text-ink-900/50">
                No conversations yet. Start one by adding a person.
              </p>
            </div>
          ) : (
            conversations.map((c) => (
              <ConversationListItem
                key={c.id}
                conversation={c}
                isActive={c.id === activeConversationId}
                onClick={() => setActiveConversationId(c.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Active chat window */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <ChatWindow conversation={activeConversation} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-signal-500/10 flex items-center justify-center">
              <MessageCircleMore className="w-8 h-8 text-signal-500" />
            </div>
            <p className="text-ink-900/40 text-sm">Select a conversation or start a new one.</p>
          </div>
        )}
      </div>

      {showNewChatModal && (
        <NewChatModal onClose={() => setShowNewChatModal(false)} onSelectUser={handleSelectUser} />
      )}
    </div>
  );
}
