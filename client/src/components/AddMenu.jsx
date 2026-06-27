import { useState } from "react";
import { UserPlus, MessageCirclePlus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AddFriendModal from "./AddFriendModal.jsx";
import NewChatModal from "./NewChatModal.jsx";

export default function AddMenu({ onClose }) {
  const [view, setView] = useState("menu"); // menu | add-friend | new-chat
  const navigate = useNavigate();

  if (view === "add-friend") {
    return <AddFriendModal onClose={onClose} />;
  }

  if (view === "new-chat") {
    return (
      <NewChatModal
        onClose={onClose}
        onSelectUser={() => {
          onClose();
          navigate("/");
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl w-full max-w-md p-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-display font-bold text-lg text-ink-900">Add</h2>
          <button onClick={onClose} className="text-ink-900/40 hover:text-ink-900/70">
            <X className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={() => setView("add-friend")}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-ink-900/[0.04] transition-colors text-left"
        >
          <span className="w-10 h-10 rounded-full bg-signal-500/10 text-signal-500 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </span>
          <div>
            <p className="font-medium text-sm text-ink-900">Add Friend</p>
            <p className="text-xs text-ink-900/45">Send a friend request to someone</p>
          </div>
        </button>

        <button
          onClick={() => setView("new-chat")}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-ink-900/[0.04] transition-colors text-left"
        >
          <span className="w-10 h-10 rounded-full bg-mint-500/10 text-mint-500 flex items-center justify-center">
            <MessageCirclePlus className="w-5 h-5" />
          </span>
          <div>
            <p className="font-medium text-sm text-ink-900">New Chat</p>
            <p className="text-xs text-ink-900/45">Message one of your friends</p>
          </div>
        </button>
      </div>
    </div>
  );
}
