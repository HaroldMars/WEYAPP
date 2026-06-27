import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Loader2, ChevronLeft } from "lucide-react";
import Avatar from "../components/Avatar.jsx";
import Banner from "../components/Banner.jsx";
import PostComposer from "../components/PostComposer.jsx";
import PostCard from "../components/PostCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { userApi } from "../api/users.js";
import { postApi } from "../api/posts.js";

export default function ProfilePage() {
  const { user, updateUserLocal } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [nickname, setNickname] = useState(user?.nickname || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  const loadOwnPosts = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingPosts(true);
    try {
      const data = await postApi.list({ authorId: user.id });
      setPosts(data.posts);
    } catch (err) {
      console.error("Failed to load your posts:", err.message);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadOwnPosts();
  }, [loadOwnPosts]);

  useEffect(() => {
    setNickname(user?.nickname || "");
    setBio(user?.bio || "");
  }, [user?.nickname, user?.bio]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setMessage({ type: "", text: "" });
    try {
      const data = await userApi.updateAvatar(file);
      updateUserLocal(data.user);
      setMessage({ type: "success", text: "Profile picture updated." });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleNicknameBlur = async () => {
    if (nickname === (user?.nickname || "")) return;
    try {
      const data = await userApi.updateProfile({ nickname });
      updateUserLocal(data.user);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleSaveBio = async () => {
    setIsSavingBio(true);
    try {
      const data = await userApi.updateProfile({ bio });
      updateUserLocal(data.user);
      setIsEditingBio(false);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsSavingBio(false);
    }
  };

  const handlePostCreated = (post) => {
    setPosts((prev) => [post, ...prev]);
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

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
        {message.text && <Banner type={message.type}>{message.text}</Banner>}

        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar name={user?.name} avatar={user?.avatar} size="lg" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-signal-500 text-white
                flex items-center justify-center ring-2 ring-paper-50 hover:bg-signal-400 transition-colors"
              aria-label="Change profile picture"
            >
              {isUploadingAvatar ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Camera className="w-3 h-3" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <div className="flex-1 min-w-0">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 30))}
              onBlur={handleNicknameBlur}
              placeholder={user?.name}
              className="w-full font-display font-bold text-lg text-ink-900 bg-transparent outline-none
                placeholder:text-ink-900/40 border-b border-transparent focus:border-signal-500 transition-colors"
            />
            <p className="text-xs text-ink-900/40">{user?.name}</p>
          </div>
        </div>

        <div className="bg-signal-500/[0.07] rounded-xl2 p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-ink-900/60">Description</p>
            {!isEditingBio && (
              <button
                onClick={() => setIsEditingBio(true)}
                className="text-xs text-signal-500 font-semibold"
              >
                Edit
              </button>
            )}
          </div>

          {isEditingBio ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 200))}
                placeholder="Add your description here"
                rows={3}
                autoFocus
                className="w-full bg-white rounded-lg px-3 py-2 text-sm text-ink-900 outline-none
                  placeholder:text-ink-900/35 resize-none border border-signal-500/30"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-900/35">{bio.length}/200</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setBio(user?.bio || "");
                      setIsEditingBio(false);
                    }}
                    className="text-xs font-semibold text-ink-900/50 px-3 py-1.5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBio}
                    disabled={isSavingBio}
                    className="text-xs font-semibold text-white bg-signal-500 px-3 py-1.5 rounded-full disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-900/70">
              {user?.bio || "Add your description here"}
            </p>
          )}
        </div>

        <PostComposer onCreated={handlePostCreated} placeholder="Add post here" />

        <div>
          <h2 className="font-display font-bold text-base text-ink-900 mb-3">Post</h2>
          {isLoadingPosts ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-signal-500 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <p className="text-sm text-ink-900/40 px-1 pb-6">
              You haven't posted anything yet.
            </p>
          ) : (
            <div className="flex flex-col gap-3 pb-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onDeleted={handlePostDeleted} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
