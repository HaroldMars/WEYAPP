import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, UserPlus, Clock, Loader2, MessageCircle } from "lucide-react";
import Avatar from "../components/Avatar.jsx";
import PostCard from "../components/PostCard.jsx";
import { userApi } from "../api/users.js";
import { friendApi } from "../api/friends.js";
import { postApi } from "../api/posts.js";
import { conversationApi } from "../api/conversations.js";

export default function PublicProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [friendStatus, setFriendStatus] = useState("none");
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userData, postsData] = await Promise.all([
        userApi.getById(id),
        postApi.list({ authorId: id }),
      ]);
      if (userData.isSelf) {
        navigate("/profile", { replace: true });
        return;
      }
      setProfile(userData.user);
      setFriendStatus(userData.friendRequestStatus);
      setPosts(postsData.posts);
    } catch (err) {
      console.error("Failed to load profile:", err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSendRequest = async () => {
    setIsSendingRequest(true);
    try {
      await friendApi.sendRequest(id);
      setFriendStatus("sent");
    } catch (err) {
      console.error("Failed to send friend request:", err.message);
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleGoToChat = async () => {
    setIsOpeningChat(true);
    try {
      const data = await conversationApi.createOrGet(id);
      navigate(`/chat/${data.conversation.id}`);
    } catch (err) {
      console.error("Failed to open conversation:", err.message);
    } finally {
      setIsOpeningChat(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-signal-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-sm text-ink-900/50">User not found.</p>
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
        <h1 className="font-display font-bold text-lg text-ink-900">Account</h1>
      </div>

      <div className="px-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={profile.name} avatar={profile.avatar} size="lg" isOnline={profile.isOnline} showStatus />
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-lg text-ink-900 truncate">
              {profile.nickname || profile.name}
            </p>
            {profile.nickname && (
              <p className="text-xs text-ink-900/40 truncate">{profile.name}</p>
            )}
          </div>

          {friendStatus === "friends" ? (
            <span className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-signal-500/15 text-signal-500 text-xs font-bold">
              Friend
            </span>
          ) : friendStatus === "sent" ? (
            <span className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink-900/5 text-ink-900/50 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" /> Pending
            </span>
          ) : friendStatus === "received" ? (
            <span className="shrink-0 px-3 py-1.5 rounded-full bg-signal-500/10 text-signal-500 text-xs font-semibold">
              Respond in requests
            </span>
          ) : (
            <button
              onClick={handleSendRequest}
              disabled={isSendingRequest}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-signal-500 text-white text-xs font-semibold disabled:opacity-50"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add Friend
            </button>
          )}
        </div>

        {friendStatus === "friends" && (
          <button
            onClick={handleGoToChat}
            disabled={isOpeningChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full
              bg-signal-500/[0.12] text-signal-500 text-sm font-semibold hover:bg-signal-500/[0.18]
              transition-colors disabled:opacity-50"
          >
            {isOpeningChat ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageCircle className="w-4 h-4" />
            )}
            Go to message
          </button>
        )}

        <div className="bg-signal-500/[0.07] rounded-xl2 p-4">
          <p className="text-xs font-semibold text-ink-900/60 mb-1">Description</p>
          <p className="text-sm text-ink-900/70">
            {profile.bio || "This user hasn't added a description yet."}
          </p>
        </div>

        <div>
          <h2 className="font-display font-bold text-base text-ink-900 mb-3">Post</h2>
          {posts.length === 0 ? (
            <p className="text-sm text-ink-900/40 px-1 pb-6">No posts yet.</p>
          ) : (
            <div className="flex flex-col gap-3 pb-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
