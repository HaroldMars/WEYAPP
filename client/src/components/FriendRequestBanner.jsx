import { useState } from "react";
import { Check, X } from "lucide-react";
import Avatar from "./Avatar.jsx";
import { friendApi } from "../api/friends.js";

export default function FriendRequestBanner({ request, onHandled }) {
  const [isResponding, setIsResponding] = useState(false);

  const handleAccept = async () => {
    setIsResponding(true);
    try {
      await friendApi.acceptRequest(request.id);
      onHandled?.(request.id, "accepted");
    } catch (err) {
      console.error("Failed to accept request:", err.message);
      setIsResponding(false);
    }
  };

  const handleDecline = async () => {
    setIsResponding(true);
    try {
      await friendApi.declineRequest(request.id);
      onHandled?.(request.id, "declined");
    } catch (err) {
      console.error("Failed to decline request:", err.message);
      setIsResponding(false);
    }
  };

  const sender = request.sender;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <Avatar name={sender.name} avatar={sender.avatar} size="md" />
      <div className="min-w-0 flex-1">
        <p className="font-display font-semibold text-sm text-ink-900 truncate">
          {sender.nickname || sender.name}
        </p>
        {sender.phone && <p className="text-xs text-ink-900/40 truncate">{sender.phone}</p>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleDecline}
          disabled={isResponding}
          className="w-8 h-8 rounded-full bg-ink-900/5 text-ink-900/50 flex items-center justify-center hover:bg-ink-900/10 transition-colors disabled:opacity-50"
          aria-label="Decline"
        >
          <X className="w-4 h-4" />
        </button>
        <button
          onClick={handleAccept}
          disabled={isResponding}
          className="px-4 py-1.5 rounded-full bg-signal-500 text-white text-sm font-semibold disabled:opacity-50"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
