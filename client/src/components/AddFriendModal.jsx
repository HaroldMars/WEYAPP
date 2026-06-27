import { useState, useEffect, useCallback } from "react";
import { X, Search, Loader2, UserPlus, Check, Clock } from "lucide-react";
import Avatar from "./Avatar.jsx";
import { userApi } from "../api/users.js";
import { friendApi } from "../api/friends.js";

export default function AddFriendModal({ onClose }) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sentTo, setSentTo] = useState(new Set());
  const [errorByUser, setErrorByUser] = useState({});

  const loadUsers = useCallback(async (query) => {
    setIsLoading(true);
    try {
      const data = await userApi.list(query);
      setUsers(data.users);
    } catch (err) {
      console.error("Failed to load users:", err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => loadUsers(search), 300);
    return () => clearTimeout(timeout);
  }, [search, loadUsers]);

  const handleSendRequest = async (user) => {
    try {
      await friendApi.sendRequest(user.id);
      setSentTo((prev) => new Set(prev).add(user.id));
    } catch (err) {
      setErrorByUser((prev) => ({ ...prev, [user.id]: err.message }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl2 shadow-bubble w-full max-w-sm max-h-[28rem] flex flex-col animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-900/[0.06]">
          <h2 className="font-display font-bold text-lg text-ink-900">Add Friend</h2>
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
              placeholder="Search a friend"
              className="w-full pl-9 pr-3 py-2 rounded-full bg-ink-900/[0.04] text-sm text-ink-900
                placeholder:text-ink-900/35 outline-none focus:bg-ink-900/[0.06] transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-signal-500 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-sm text-ink-900/40 py-8">No users found.</p>
          ) : (
            users.map((u) => {
              const justSent = sentTo.has(u.id);
              const error = errorByUser[u.id];
              return (
                <div key={u.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
                  <Avatar name={u.name} avatar={u.avatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-ink-900 truncate">
                      {u.nickname || u.name}
                    </p>
                    <p className="text-xs text-ink-900/40 truncate">{error || u.phone || u.email}</p>
                  </div>
                  <button
                    onClick={() => handleSendRequest(u)}
                    disabled={justSent}
                    className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors
                      ${justSent ? "bg-mint-500/10 text-mint-500" : "bg-signal-500/10 text-signal-500 hover:bg-signal-500/20"}`}
                    aria-label={justSent ? "Request sent" : "Add friend"}
                  >
                    {justSent ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
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
