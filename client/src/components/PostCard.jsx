import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import Avatar from "./Avatar.jsx";
import { API_URL } from "../api/client.js";
import { postApi } from "../api/posts.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatConversationTime } from "../utils/time.js";

const resolveImageSrc = (image) => {
  if (!image) return null;
  return image.startsWith("http") ? image : `${API_URL}${image}`;
};

export default function PostCard({ post, onDeleted }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [likedByMe, setLikedByMe] = useState(post.likedByMe);
  const [comments, setComments] = useState(post.comments);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const isOwnPost = String(post.author.id) === String(user?.id);
  const imageSrc = resolveImageSrc(post.image);

  const handleToggleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    // optimistic update
    const nextLiked = !likedByMe;
    setLikedByMe(nextLiked);
    setLikeCount((c) => (nextLiked ? c + 1 : c - 1));
    try {
      const data = await postApi.toggleLike(post.id);
      setLikeCount(data.likeCount);
      setLikedByMe(data.likedByMe);
    } catch (err) {
      // revert on failure
      setLikedByMe(!nextLiked);
      setLikeCount((c) => (nextLiked ? c - 1 : c + 1));
      console.error("Failed to toggle like:", err.message);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const data = await postApi.addComment(post.id, commentText.trim());
      setComments((prev) => [...prev, data.comment]);
      setCommentText("");
    } catch (err) {
      console.error("Failed to add comment:", err.message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    try {
      await postApi.delete(post.id);
      onDeleted?.(post.id);
    } catch (err) {
      console.error("Failed to delete post:", err.message);
    }
  };

  return (
    <div className="bg-white rounded-xl2 shadow-bubble overflow-hidden animate-pop-in">
      <button
        onClick={() => navigate(isOwnPost ? "/profile" : `/users/${post.author.id}`)}
        className="w-full flex items-center gap-3 px-4 pt-4 pb-2 text-left"
      >
        <Avatar name={post.author.name} avatar={post.author.avatar} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-sm text-ink-900 truncate">
            {post.author.nickname || post.author.name}
          </p>
          <p className="text-[11px] text-ink-900/40">{formatConversationTime(post.createdAt)}</p>
        </div>
        {isOwnPost && (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="p-2 text-ink-900/30 hover:text-coral-500 transition-colors"
            aria-label="Delete post"
          >
            <Trash2 className="w-4 h-4" />
          </span>
        )}
      </button>

      {post.text && (
        <p className="px-4 pb-3 text-sm text-ink-900/85 leading-relaxed whitespace-pre-wrap break-words">
          {post.text}
        </p>
      )}

      {imageSrc && (
        <img src={imageSrc} alt="Post" className="w-full max-h-96 object-cover" loading="lazy" />
      )}

      <div className="flex items-center gap-4 px-4 py-3">
        <button
          onClick={handleToggleLike}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
            likedByMe ? "text-coral-500" : "text-ink-900/50 hover:text-coral-500"
          }`}
        >
          <Heart className={`w-5 h-5 ${likedByMe ? "fill-coral-500" : ""}`} />
          {likeCount > 0 && <span>{likeCount.toLocaleString()}</span>}
        </button>

        <button
          onClick={() => setShowComments((s) => !s)}
          className="flex items-center gap-1.5 text-sm font-medium text-ink-900/50 hover:text-signal-500 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          {comments.length > 0 && <span>{comments.length.toLocaleString()}</span>}
        </button>
      </div>

      {showComments && (
        <div className="border-t border-ink-900/[0.06] px-4 py-3 space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <Avatar name={c.author.name} avatar={c.author.avatar} size="sm" />
              <div className="bg-ink-900/[0.04] rounded-xl px-3 py-2 flex-1 min-w-0">
                <p className="text-xs font-semibold text-ink-900">
                  {c.author.nickname || c.author.name}
                </p>
                <p className="text-sm text-ink-900/80 break-words">{c.text}</p>
              </div>
            </div>
          ))}

          <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3.5 py-2 rounded-full bg-ink-900/[0.04] text-sm text-ink-900
                placeholder:text-ink-900/35 outline-none focus:bg-ink-900/[0.06] transition-colors"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isSubmittingComment}
              className="w-9 h-9 shrink-0 rounded-full bg-signal-500 text-white flex items-center justify-center
                disabled:opacity-30 transition-opacity"
              aria-label="Send comment"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
