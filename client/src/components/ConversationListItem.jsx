import Avatar from "./Avatar.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { formatConversationTime } from "../utils/time.js";

export default function ConversationListItem({ conversation, isActive, onClick }) {
  const { isUserOnline } = useSocket();
  const peer = conversation.participants[0];
  if (!peer) return null;

  const preview = conversation.lastMessage
    ? conversation.lastMessage.image && !conversation.lastMessage.text
      ? "📷 Photo"
      : conversation.lastMessage.text
    : "Say hello 👋";

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-150
        ${isActive ? "bg-signal-500/10" : "hover:bg-ink-900/[0.04]"}`}
    >
      <Avatar name={peer.name} avatar={peer.avatar} isOnline={isUserOnline(peer.id)} showStatus />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display font-semibold text-sm text-ink-900 truncate">
            {peer.nickname || peer.name}
          </span>
          {conversation.lastMessage && (
            <span className="text-[11px] text-ink-900/40 shrink-0">
              {formatConversationTime(conversation.lastMessage.createdAt)}
            </span>
          )}
        </div>
        <p className="text-sm text-ink-900/50 truncate mt-0.5">{preview}</p>
      </div>
    </button>
  );
}
