import { useEffect, useRef } from "react";
import Avatar from "./Avatar.jsx";
import MessageBubble from "./MessageBubble.jsx";
import TypingIndicator from "./TypingIndicator.jsx";
import ChatInput from "./ChatInput.jsx";
import { useMessages } from "../hooks/useMessages.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { messageApi } from "../api/conversations.js";
import { formatLastSeen } from "../utils/time.js";

export default function ChatWindow({ conversation }) {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const peer = conversation.participants[0];
  const {
    messages,
    isLoading,
    typingUserId,
    sendText,
    appendImageMessage,
    notifyTyping,
    notifyStopTyping,
  } = useMessages(conversation.id);

  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typingUserId]);

  const handleSendImage = async (file) => {
    const data = await messageApi.sendImage(conversation.id, file);
    appendImageMessage(data.message);
  };

  const peerIsOnline = isUserOnline(peer.id);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-ink-900/[0.06] bg-white">
        <Avatar name={peer.name} avatar={peer.avatar} isOnline={peerIsOnline} showStatus />
        <div>
          <p className="font-display font-semibold text-sm text-ink-900">{peer.name}</p>
          <p className="text-xs text-ink-900/40">
            {peerIsOnline ? "Active now" : formatLastSeen(peer.lastSeen)}
          </p>
        </div>
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
            <p className="text-sm text-ink-900/35">Say hello to {peer.name} 👋</p>
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble key={m.id} message={m} isOwn={String(m.sender.id) === String(user.id)} />
          ))
        )}
        {typingUserId && String(typingUserId) === String(peer.id) && <TypingIndicator />}
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
