import { useState, useRef } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import Avatar from "./Avatar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { postApi } from "../api/posts.js";

export default function PostComposer({ onCreated, placeholder = "What's on your mind?" }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState("");

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !selectedFile) return;
    setIsPosting(true);
    setError("");
    try {
      const data = await postApi.create(text.trim(), selectedFile);
      onCreated?.(data.post);
      setText("");
      clearImage();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl2 shadow-bubble p-4 flex flex-col gap-3"
    >
      <div className="flex items-start gap-3">
        <Avatar name={user?.name} avatar={user?.avatar} size="sm" />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={imagePreview ? 2 : 1}
          className="flex-1 resize-none px-3.5 py-2 rounded-xl bg-ink-900/[0.04] text-sm text-ink-900
            placeholder:text-ink-900/35 outline-none focus:bg-ink-900/[0.06] transition-colors"
        />
      </div>

      {imagePreview && (
        <div className="relative inline-block self-start ml-11">
          <img src={imagePreview} alt="Selected" className="h-32 rounded-xl object-cover" />
          <button
            type="button"
            onClick={clearImage}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-ink-900 text-white flex items-center justify-center"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {error && <p className="text-xs text-coral-500 font-medium ml-11">{error}</p>}

      <div className="flex items-center justify-between ml-11">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-sm font-medium text-ink-900/50 hover:text-signal-500 transition-colors"
        >
          <ImagePlus className="w-4.5 h-4.5" />
          Photo
        </button>

        <button
          type="submit"
          disabled={(!text.trim() && !selectedFile) || isPosting}
          className="px-4 py-1.5 rounded-full bg-signal-500 text-white text-sm font-semibold
            disabled:opacity-30 transition-opacity flex items-center gap-1.5"
        >
          {isPosting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Post
        </button>
      </div>
    </form>
  );
}
