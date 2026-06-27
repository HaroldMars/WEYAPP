import { useState, useEffect, useCallback } from "react";
import { Loader2, FileText } from "lucide-react";
import PostComposer from "../components/PostComposer.jsx";
import PostCard from "../components/PostCard.jsx";
import { postApi } from "../api/posts.js";

export default function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await postApi.list();
      setPosts(data.posts);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleCreated = (post) => {
    setPosts((prev) => [post, ...prev]);
  };

  const handleDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="min-h-full bg-paper-50 px-4 py-4 flex flex-col gap-4">
      <h1 className="font-display font-bold text-xl text-ink-900 px-1">Post</h1>

      <PostComposer onCreated={handleCreated} />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-signal-500 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-center text-sm text-coral-500 py-8">{error}</p>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center text-center px-6 py-16 gap-3">
          <div className="w-12 h-12 rounded-full bg-signal-500/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-signal-500" />
          </div>
          <p className="text-sm text-ink-900/50">
            No posts yet. Be the first to share something.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 pb-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
