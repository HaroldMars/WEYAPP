import { useState, useEffect } from "react";
import { X, Search, Loader2, Check, Users } from "lucide-react";
import Avatar from "./Avatar.jsx";
import { friendApi } from "../api/friends.js";
import { conversationApi } from "../api/conversations.js";

export default function CreateGroupModal({ onClose, onCreated }) {
  const [step, setStep] = useState("members"); // "members" | "name"
  const [search, setSearch] = useState("");
  const [friends, setFriends] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [groupName, setGroupName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

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

  const toggleSelect = (friendId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(friendId)) next.delete(friendId);
      else next.add(friendId);
      return next;
    });
  };

  const handleContinue = () => {
    if (selectedIds.size < 2) {
      setError("Select at least 2 friends to start a group.");
      return;
    }
    setError("");
    setStep("name");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError("Please give your group a name.");
      return;
    }
    setIsCreating(true);
    setError("");
    try {
      const data = await conversationApi.createGroup(groupName.trim(), [...selectedIds]);
      onCreated?.(data.conversation);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl2 shadow-bubble w-full max-w-sm max-h-[32rem] flex flex-col animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-900/[0.06]">
          <h2 className="font-display font-bold text-lg text-ink-900">
            {step === "members" ? "Create Group Chat" : "Name your group"}
          </h2>
          <button onClick={onClose} className="text-ink-900/40 hover:text-ink-900/70">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === "members" ? (
          <>
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
              {selectedIds.size > 0 && (
                <p className="text-xs text-signal-500 font-medium mt-2">
                  {selectedIds.size} selected (minimum 2)
                </p>
              )}
              {error && <p className="text-xs text-coral-500 font-medium mt-2">{error}</p>}
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 text-signal-500 animate-spin" />
                </div>
              ) : friends.length === 0 ? (
                <p className="text-center text-sm text-ink-900/40 px-6 py-8">
                  You need at least 2 friends to start a group chat.
                </p>
              ) : filtered.length === 0 ? (
                <p className="text-center text-sm text-ink-900/40 py-8">No friends match your search.</p>
              ) : (
                filtered.map((f) => {
                  const isSelected = selectedIds.has(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() => toggleSelect(f.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ink-900/[0.04] transition-colors text-left"
                    >
                      <Avatar name={f.name} avatar={f.avatar} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-ink-900 truncate">
                          {f.nickname || f.name}
                        </p>
                        <p className="text-xs text-ink-900/40 truncate">{f.email}</p>
                      </div>
                      <span
                        className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                          ${isSelected ? "bg-signal-500 border-signal-500" : "border-ink-900/20"}`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="px-5 py-4 border-t border-ink-900/[0.06]">
              <button
                onClick={handleContinue}
                disabled={selectedIds.size < 2}
                className="w-full py-2.5 rounded-full bg-signal-500 text-white text-sm font-semibold disabled:opacity-40 transition-opacity"
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleCreate} className="flex flex-col gap-4 px-5 py-5">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-signal-500/10 flex items-center justify-center">
                <Users className="w-7 h-7 text-signal-500" />
              </div>
            </div>

            <input
              autoFocus
              value={groupName}
              onChange={(e) => setGroupName(e.target.value.slice(0, 50))}
              placeholder="Group name"
              className="w-full px-4 py-2.5 rounded-xl border border-ink-900/10 bg-white text-sm text-ink-900
                placeholder:text-ink-900/35 outline-none focus:border-signal-500 transition-colors text-center font-display font-semibold"
            />

            <p className="text-xs text-ink-900/40 text-center">
              {selectedIds.size} members will be added to this group.
            </p>

            {error && <p className="text-xs text-coral-500 font-medium text-center">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("members")}
                className="flex-1 py-2.5 rounded-full bg-ink-900/5 text-ink-900/60 text-sm font-semibold"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isCreating || !groupName.trim()}
                className="flex-1 py-2.5 rounded-full bg-signal-500 text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                Create
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
