import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Trash2 } from "lucide-react";
import Avatar from "./Avatar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { postApi } from "../api/posts.js";
import { formatConversationTime } from "../utils/time.js";

/**
 * Renders one comment plus all of its nested replies recursively.
 * `allComments` is the full flat list for this post - each node finds its own
 * children by matching parentId, which is what makes arbitrary-depth nesting work.
 */
export default function CommentThread({
  comment,
  allComments,
  postId,
  postAuthorId,
  depth = 0,
  onCommentAdded,
  onCommentDeleted,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const children = allComments.filter((c) => String(c.parentId) === String(comment.id));
  const canDelete =
    !comment.deleted &&
    (String(comment.author?.id) === String(user?.id) || String(postAuthorId) === String(user?.id));

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const data = await postApi.addComment(postId, replyText.trim(), comment.id);
      onCommentAdded(data.comment);
      setReplyText("");
      setShowReplyBox(false);
    } catch (err) {
      console.error("Failed to add reply:", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await postApi.deleteComment(postId, comment.id);
      onCommentDeleted(comment.id);
    } catch (err) {
      console.error("Failed to delete comment:", err.message);
    }
  };

  return (
    <div className={depth > 0 ? "ml-9 mt-2" : ""}>
      <div className="flex items-start gap-2.5">
        {!comment.deleted ? (
          <button onClick={() => navigate(`/users/${comment.author.id}`)} className="shrink-0">
            <Avatar name={comment.author.name} avatar={comment.author.avatar} size="sm" />
          </button>
        ) : (
          <div className="w-8 h-8 shrink-0 rounded-full bg-ink-900/5" />
        )}

        <div className="flex-1 min-w-0">
          <div className="bg-ink-900/[0.04] rounded-xl px-3 py-2 flex-1 min-w-0">
            {!comment.deleted ? (
              <>
                <p className="text-xs font-semibold text-ink-900">
                  {comment.author.nickname || comment.author.name}
                </p>
                <p className="text-sm text-ink-900/80 break-words">{comment.text}</p>
              </>
            ) : (
              <p className="text-sm text-ink-900/35 italic">This comment was deleted.</p>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 px-1">
            <span className="text-[11px] text-ink-900/35">
              {formatConversationTime(comment.createdAt)}
            </span>
            {!comment.deleted && (
              <button
                onClick={() => setShowReplyBox((s) => !s)}
                className="text-[11px] font-semibold text-ink-900/45 hover:text-signal-500 transition-colors"
              >
                Reply
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="text-[11px] font-semibold text-ink-900/45 hover:text-coral-500 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            )}
          </div>

          {showReplyBox && (
            <form onSubmit={handleReply} className="flex items-center gap-2 mt-2">
              <input
                autoFocus
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${comment.author.nickname || comment.author.name}...`}
                className="flex-1 px-3 py-1.5 rounded-full bg-ink-900/[0.04] text-sm text-ink-900
                  placeholder:text-ink-900/35 outline-none focus:bg-ink-900/[0.06] transition-colors"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || isSubmitting}
                className="w-8 h-8 shrink-0 rounded-full bg-signal-500 text-white flex items-center justify-center
                  disabled:opacity-30 transition-opacity"
                aria-label="Send reply"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {children.map((child) => (
            <CommentThread
              key={child.id}
              comment={child}
              allComments={allComments}
              postId={postId}
              postAuthorId={postAuthorId}
              depth={depth + 1}
              onCommentAdded={onCommentAdded}
              onCommentDeleted={onCommentDeleted}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
