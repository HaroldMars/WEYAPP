import { useState, useEffect, useCallback } from "react";
import { X, Search, Loader2 } from "lucide-react";
import Avatar from "./Avatar.jsx";
import { friendApi } from "../api/friends.js";

export default function NewChatModal({ onClose, onSelectUser }) {
  const [search, setSearch] = useState("");
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    friendApi
      .list()
      .then((data) => setFriends(data.friends))
      .catch((err) => console.error("Failed to load friends:", err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = friends.filter((f) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.nickname?.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl2 shadow-bubble w-full max-w-sm max-h-[28rem] flex flex-col animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-900/[0.06]">
          <h2 className="font-display font-bold text-lg text-ink-900">New conversation</h2>
          <button onClick={onClose} className="text-ink-900/40 hover:text-ink-900/70">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-900/35" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your friends..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-ink-900/[0.04] text-sm text-ink-900
                placeholder:text-ink-900/35 outline-none focus:bg-ink-900/[0.06] transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-signal-500 animate-spin" />
            </div>
          ) : friends.length === 0 ? (
            <p className="text-center text-sm text-ink-900/40 px-6 py-8">
              You don't have any friends yet. Add a friend first, then you can start chatting.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-ink-900/40 py-8">No friends match your search.</p>
          ) : (
            filtered.map((f) => (
              <button
                key={f.id}
                onClick={() => onSelectUser(f)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ink-900/[0.04] transition-colors text-left"
              >
                <Avatar name={f.name} avatar={f.avatar} size="sm" />
                <div className="min-w-0">
                  <p className="font-medium text-sm text-ink-900 truncate">
                    {f.nickname || f.name}
                  </p>
                  <p className="text-xs text-ink-900/40 truncate">{f.email}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

