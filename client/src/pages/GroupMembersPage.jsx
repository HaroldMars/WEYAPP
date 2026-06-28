import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Crown, Shield, MoreVertical, Loader2, Check, X } from "lucide-react";
import Avatar from "../components/Avatar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { conversationApi } from "../api/conversations.js";
import { userApi } from "../api/users.js";

export default function GroupMembersPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUserLocal } = useAuth();

  const [conversation, setConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuFor, setOpenMenuFor] = useState(null);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameValue, setNicknameValue] = useState(user?.nickname || "");
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await conversationApi.getDetails(id);
      setConversation(data.conversation);
    } catch (err) {
      console.error("Failed to load group:", err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isCreator = conversation && String(conversation.createdBy) === String(user?.id);
  const isAdmin = conversation?.admins?.some((a) => String(a) === String(user?.id));
  const canManage = isCreator || isAdmin;

  const handleSaveNickname = async () => {
    setIsSavingNickname(true);
    setActionError("");
    try {
      const data = await userApi.updateProfile({ nickname: nicknameValue.trim() });
      updateUserLocal(data.user);
      setEditingNickname(false);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSavingNickname(false);
    }
  };

  const handleKick = async (memberId) => {
    setActionError("");
    try {
      await conversationApi.removeMember(id, memberId);
      setConversation((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== memberId),
        admins: prev.admins.filter((a) => String(a) !== String(memberId)),
      }));
      setOpenMenuFor(null);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handlePromote = async (memberId) => {
    setActionError("");
    try {
      await conversationApi.promoteToAdmin(id, memberId);
      setConversation((prev) => ({ ...prev, admins: [...prev.admins, memberId] }));
      setOpenMenuFor(null);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleDemote = async (memberId) => {
    setActionError("");
    try {
      await conversationApi.demoteAdmin(id, memberId);
      setConversation((prev) => ({
        ...prev,
        admins: prev.admins.filter((a) => String(a) !== String(memberId)),
      }));
      setOpenMenuFor(null);
    } catch (err) {
      setActionError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-signal-500 animate-spin" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-sm text-ink-900/50">This group couldn't be found.</p>
        <button onClick={() => navigate(-1)} className="text-sm text-signal-500 font-medium">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-paper-50">
      <div className="flex items-center gap-3 px-4 py-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-ink-900/60 hover:bg-ink-900/5 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-lg text-ink-900">Members</h1>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {/* Your own nickname - quick edit */}
        <div className="bg-white rounded-xl2 shadow-bubble p-4">
          <p className="text-xs font-semibold text-ink-900/50 mb-2">Your nickname</p>
          {editingNickname ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={nicknameValue}
                onChange={(e) => setNicknameValue(e.target.value.slice(0, 30))}
                placeholder={user?.name}
                className="flex-1 px-3 py-2 rounded-xl bg-ink-900/[0.04] text-sm text-ink-900
                  placeholder:text-ink-900/35 outline-none focus:bg-ink-900/[0.06] transition-colors"
              />
              <button
                onClick={handleSaveNickname}
                disabled={isSavingNickname}
                className="w-9 h-9 shrink-0 rounded-full bg-signal-500 text-white flex items-center justify-center disabled:opacity-50"
              >
                {isSavingNickname ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setEditingNickname(false);
                  setNicknameValue(user?.nickname || "");
                }}
                className="w-9 h-9 shrink-0 rounded-full bg-ink-900/5 text-ink-900/50 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingNickname(true)}
              className="flex items-center gap-3 w-full text-left"
            >
              <Avatar name={user?.name} avatar={user?.avatar} size="sm" />
              <span className="text-sm font-medium text-ink-900">
                {user?.nickname || "Set a nickname"}
              </span>
            </button>
          )}
        </div>

        {actionError && <p className="text-xs text-coral-500 font-medium px-1">{actionError}</p>}

        <div>
          <p className="text-xs font-semibold text-ink-900/50 px-1 mb-2">
            {conversation.members.length} members
          </p>
          <div className="bg-white rounded-xl2 shadow-bubble overflow-hidden divide-y divide-ink-900/[0.05]">
            {conversation.members.map((m) => {
              const memberIsCreator = String(conversation.createdBy) === String(m.id);
              const memberIsAdmin = conversation.admins.some((a) => String(a) === String(m.id));
              const isMe = String(m.id) === String(user.id);

              return (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={m.name} avatar={m.avatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900 truncate flex items-center gap-1.5">
                      {m.nickname || m.name}
                      {isMe && <span className="text-ink-900/35 text-xs">(you)</span>}
                    </p>
                    {(memberIsCreator || memberIsAdmin) && (
                      <p className="text-[11px] text-signal-500 font-semibold flex items-center gap-1">
                        {memberIsCreator ? (
                          <>
                            <Crown className="w-3 h-3" /> Creator
                          </>
                        ) : (
                          <>
                            <Shield className="w-3 h-3" /> Admin
                          </>
                        )}
                      </p>
                    )}
                  </div>

                  {canManage && !isMe && !memberIsCreator && (
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuFor(openMenuFor === m.id ? null : m.id)}
                        className="p-2 text-ink-900/30 hover:text-ink-900/60 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuFor === m.id && (
                        <div className="absolute right-0 top-9 w-44 bg-white rounded-xl shadow-bubble py-1.5 z-10 animate-pop-in">
                          {isCreator && !memberIsAdmin && (
                            <button
                              onClick={() => handlePromote(m.id)}
                              className="w-full text-left px-4 py-2.5 text-sm text-ink-900 hover:bg-ink-900/[0.04]"
                            >
                              Make admin
                            </button>
                          )}
                          {isCreator && memberIsAdmin && (
                            <button
                              onClick={() => handleDemote(m.id)}
                              className="w-full text-left px-4 py-2.5 text-sm text-ink-900 hover:bg-ink-900/[0.04]"
                            >
                              Remove admin
                            </button>
                          )}
                          <button
                            onClick={() => handleKick(m.id)}
                            className="w-full text-left px-4 py-2.5 text-sm text-coral-500 font-medium hover:bg-coral-500/5"
                          >
                            Remove from group
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
