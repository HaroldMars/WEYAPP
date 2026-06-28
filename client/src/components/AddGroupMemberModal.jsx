import { useState, useEffect } from "react";
import { X, Search, Loader2, UserPlus, Check } from "lucide-react";
import Avatar from "./Avatar.jsx";
import { friendApi } from "../api/friends.js";
import { conversationApi } from "../api/conversations.js";

export default function AddGroupMemberModal({ conversationId, existingMemberIds, onClose, onAdded }) {
  const [search, setSearch] = useState("");
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addedIds, setAddedIds] = useState(new Set());
  const [errorByUser, setErrorByUser] = useState({});

  useEffect(() => {
    friendApi
      .list()
      .then((data) => setFriends(data.friends))
      .catch((err) => console.error("Failed to load friends:", err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const existingSet = new Set(existingMemberIds.map(String));
  const eligible = friends.filter((f) => !existingSet.has(String(f.id)));

  const filtered = eligible.filter((f) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return f.name.toLowerCase().includes(q) || f.nickname?.toLowerCase().includes(q);
  });

  const handleAdd = async (friend) => {
    try {
      const data = await conversationApi.addMember(conversationId, friend.id);
      setAddedIds((prev) => new Set(prev).add(friend.id));
      onAdded?.(data.members);
    } catch (err) {
      setErrorByUser((prev) => ({ ...prev, [friend.id]: err.message }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl2 shadow-bubble w-full max-w-sm max-h-[28rem] flex flex-col animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-900/[0.06]">
          <h2 className="font-display font-bold text-lg text-ink-900">Add Member</h2>
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
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-ink-900/40 px-6 py-8">
              {eligible.length === 0
                ? "All your friends are already in this group."
                : "No friends match your search."}
            </p>
          ) : (
            filtered.map((f) => {
              const isAdded = addedIds.has(f.id);
              const error = errorByUser[f.id];
              return (
                <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
                  <Avatar name={f.name} avatar={f.avatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-ink-900 truncate">
                      {f.nickname || f.name}
                    </p>
                    <p className="text-xs text-ink-900/40 truncate">{error || f.email}</p>
                  </div>
                  <button
                    onClick={() => handleAdd(f)}
                    disabled={isAdded}
                    className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors
                      ${isAdded ? "bg-mint-500/10 text-mint-500" : "bg-signal-500/10 text-signal-500 hover:bg-signal-500/20"}`}
                    aria-label={isAdded ? "Added" : "Add to group"}
                  >
                    {isAdded ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
