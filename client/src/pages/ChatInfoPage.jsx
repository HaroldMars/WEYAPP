import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Camera, Loader2, Users, UserPlus } from "lucide-react";
import Avatar from "../components/Avatar.jsx";
import AddGroupMemberModal from "../components/AddGroupMemberModal.jsx";
import { conversationApi } from "../api/conversations.js";
import { API_URL } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function ChatInfoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [conversation, setConversation] = useState(null);
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState("");
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await conversationApi.getDetails(id);
      setConversation(data.conversation);
      setGroupNameInput(data.conversation.groupName || "");
    } catch (err) {
      console.error("Failed to load conversation info:", err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const loadMedia = useCallback(async () => {
    setIsLoadingMedia(true);
    try {
      const data = await conversationApi.getSharedMedia(id);
      setMedia(data.media);
    } catch (err) {
      console.error("Failed to load shared media:", err.message);
    } finally {
      setIsLoadingMedia(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    loadMedia();
  }, [load, loadMedia]);

  const handleGroupNameBlur = async () => {
    if (!conversation || groupNameInput.trim() === conversation.groupName) return;
    try {
      await conversationApi.updateGroupInfo(id, { name: groupNameInput.trim() });
      setConversation((prev) => ({ ...prev, groupName: groupNameInput.trim() }));
    } catch (err) {
      console.error("Failed to update group name:", err.message);
      setGroupNameInput(conversation.groupName || "");
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSavingAvatar(true);
    try {
      const data = await conversationApi.updateGroupInfo(id, { avatarFile: file });
      setConversation((prev) => ({ ...prev, groupAvatar: data.groupAvatar }));
    } catch (err) {
      console.error("Failed to update group avatar:", err.message);
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleMemberAdded = (members) => {
    setConversation((prev) => ({ ...prev, members }));
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
        <p className="text-sm text-ink-900/50">This conversation couldn't be found.</p>
        <button onClick={() => navigate(-1)} className="text-sm text-signal-500 font-medium">
          Go back
        </button>
      </div>
    );
  }

  const isGroup = conversation.isGroup;
  const peer = !isGroup ? conversation.members.find((m) => String(m.id) !== String(user.id)) : null;
  const existingMemberIds = conversation.members?.map((m) => m.id) || [];

  return (
    <div className="min-h-full bg-paper-50">
      <div className="flex items-center gap-3 px-4 py-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-ink-900/60 hover:bg-ink-900/5 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-lg text-ink-900 flex-1 text-center -ml-9">
          {isGroup ? "Group Chat" : "Contact"}
        </h1>
      </div>

      <div className="flex flex-col items-center gap-2 py-2">
        {isGroup ? (
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-ink-900/5 flex items-center justify-center overflow-hidden">
              {conversation.groupAvatar ? (
                <img
                  src={
                    conversation.groupAvatar.startsWith("http")
                      ? conversation.groupAvatar
                      : `${API_URL}${conversation.groupAvatar}`
                  }
                  alt="Group"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="w-9 h-9 text-ink-900/25" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isSavingAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-ink-900 text-white
                flex items-center justify-center ring-2 ring-paper-50"
              aria-label="Change group photo"
            >
              {isSavingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        ) : (
          <Avatar name={peer?.name} avatar={peer?.avatar} size="xl" />
        )}

        {isGroup ? (
          <input
            value={groupNameInput}
            onChange={(e) => setGroupNameInput(e.target.value.slice(0, 50))}
            onBlur={handleGroupNameBlur}
            placeholder="Groupchat name"
            className="font-display font-bold text-lg text-ink-900 bg-transparent text-center outline-none
              placeholder:text-ink-900/40 border-b border-transparent focus:border-signal-500 transition-colors mt-1"
          />
        ) : (
          <button
            onClick={() => navigate(`/users/${peer.id}`)}
            className="font-display font-bold text-lg text-ink-900 mt-1"
          >
            {peer?.nickname || peer?.name}
          </button>
        )}
      </div>

      <div className="px-4 flex flex-col gap-3 mt-2">
        {isGroup && (
          <>
            <button
              onClick={() => setShowAddMember(true)}
              className="w-full py-3 rounded-full bg-signal-500/[0.12] text-signal-500 text-sm font-semibold
                hover:bg-signal-500/[0.18] transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Add member
            </button>
            <button
              onClick={() => navigate(`/chat/${id}/members`)}
              className="w-full py-3 rounded-full bg-signal-500/[0.12] text-signal-500 text-sm font-semibold
                hover:bg-signal-500/[0.18] transition-colors"
            >
              See members
            </button>
          </>
        )}

        {!isGroup && (
          <button
            onClick={() => navigate(`/users/${peer.id}`)}
            className="w-full py-3 rounded-full bg-signal-500/[0.12] text-signal-500 text-sm font-semibold
              hover:bg-signal-500/[0.18] transition-colors"
          >
            View profile
          </button>
        )}

        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-xs font-semibold text-ink-900/50">Shared Photos</p>
            {media.length > 0 && (
              <span className="text-xs text-ink-900/35">{media.length}</span>
            )}
          </div>

          {isLoadingMedia ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-signal-500 animate-spin" />
            </div>
          ) : media.length === 0 ? (
            <p className="text-sm text-ink-900/40 px-1 py-4">No photos shared yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {media.map((m) => {
                const src = m.image.startsWith("http") ? m.image : `${API_URL}${m.image}`;
                return (
                  <a
                    key={m.id}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-lg overflow-hidden bg-ink-900/5"
                  >
                    <img src={src} alt="Shared" className="w-full h-full object-cover" loading="lazy" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showAddMember && (
        <AddGroupMemberModal
          conversationId={id}
          existingMemberIds={existingMemberIds}
          onClose={() => setShowAddMember(false)}
          onAdded={handleMemberAdded}
        />
      )}
    </div>
  );
}
