import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Users } from "lucide-react";
import Avatar from "./Avatar.jsx";
import MessageBubble from "./MessageBubble.jsx";
import TypingIndicator from "./TypingIndicator.jsx";
import ChatInput from "./ChatInput.jsx";
import { useMessages } from "../hooks/useMessages.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { messageApi } from "../api/conversations.js";
import { formatLastSeen } from "../utils/time.js";

export default function ChatWindow({ conversation, onBack }) {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const navigate = useNavigate();
  const isGroup = conversation.isGroup;
  const peer = !isGroup ? conversation.participants[0] : null;
  const {
    messages,
    isLoading,
    typingUserId,
    sendText,
    appendImageMessage,
    notifyTyping,
    notifyStopTyping,
    deleteMessage,
  } = useMessages(conversation.id);

  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typingUserId]);

  const handleSendImage = async (file) => {
    const data = await messageApi.sendImage(conversation.id, file);
    appendImageMessage(data.message);
  };

  if (!isGroup && !peer) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-ink-900/40">This conversation is unavailable.</p>
      </div>
    );
  }

  const peerIsOnline = peer ? isUserOnline(peer.id) : false;
  const typingPersonName = isGroup
    ? conversation.participants.find((p) => String(p.id) === String(typingUserId))?.name
    : peer?.name;

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-ink-900/[0.06] bg-white">
        {onBack && (
          <button
            onClick={onBack}
            className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-ink-900/60 hover:bg-ink-900/5 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {isGroup ? (
          <button
            onClick={() => navigate(`/chat/${conversation.id}/info`)}
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
          >
            <div className="w-11 h-11 rounded-full bg-signal-500/15 text-signal-500 flex items-center justify-center shrink-0 overflow-hidden">
              {conversation.groupAvatar ? (
                <Avatar name={conversation.groupName} avatar={conversation.groupAvatar} />
              ) : (
                <Users className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-display font-semibold text-sm text-ink-900 truncate">
                {conversation.groupName || "Group chat"}
              </p>
              <p className="text-xs text-ink-900/40 truncate">
                {conversation.participants.length + 1} members
              </p>
            </div>
          </button>
        ) : (
          <button
            onClick={() => navigate(`/chat/${conversation.id}/info`)}
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
          >
            <Avatar name={peer.name} avatar={peer.avatar} isOnline={peerIsOnline} showStatus />
            <div className="min-w-0">
              <p className="font-display font-semibold text-sm text-ink-900 truncate">
                {peer.nickname || peer.name}
              </p>
              <p className="text-xs text-ink-900/40">
                {peerIsOnline ? "Active now" : formatLastSeen(peer.lastSeen)}
              </p>
            </div>
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-signal-500/40 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-signal-500/40 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-signal-500/40 animate-bounce" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-ink-900/35">
              {isGroup ? "Say hello to the group 👋" : `Say hello to ${peer.name} 👋`}
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              isOwn={String(m.sender.id) === String(user.id)}
              showSenderName={isGroup}
              onDelete={deleteMessage}
            />
          ))
        )}
        {typingUserId && typingPersonName && <TypingIndicator name={isGroup ? typingPersonName : undefined} />}
      </div>

      <ChatInput
        onSendText={sendText}
        onSendImage={handleSendImage}
        onTyping={notifyTyping}
        onStopTyping={notifyStopTyping}
      />
    </div>
  );
}
