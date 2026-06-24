import { useState, useRef, useCallback } from "react";
import { Send, ImagePlus, Loader2, X } from "lucide-react";

export default function ChatInput({ onSendText, onSendImage, onTyping, onStopTyping }) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleTextChange = (e) => {
    setText(e.target.value);
    onTyping?.();
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onStopTyping?.(), 1500);
  };

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

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (isSending || isUploadingImage) return;

      if (selectedFile) {
        setIsUploadingImage(true);
        try {
          await onSendImage(selectedFile);
          clearImage();
        } catch (err) {
          console.error("Failed to send image:", err.message);
        } finally {
          setIsUploadingImage(false);
        }
        return;
      }

      if (!text.trim()) return;
      setIsSending(true);
      try {
        await onSendText(text.trim());
        setText("");
        onStopTyping?.();
      } catch (err) {
        console.error("Failed to send message:", err.message);
      } finally {
        setIsSending(false);
      }
    },
    [text, selectedFile, isSending, isUploadingImage, onSendText, onSendImage, onStopTyping]
  );

  return (
    <form onSubmit={handleSubmit} className="border-t border-ink-900/[0.06] bg-white px-4 py-3">
      {imagePreview && (
        <div className="mb-2 relative inline-block">
          <img src={imagePreview} alt="Selected" className="h-20 rounded-lg object-cover" />
          <button
            type="button"
            onClick={clearImage}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-ink-900 text-white flex items-center justify-center"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
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
          className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-ink-900/50 hover:bg-ink-900/5 hover:text-signal-500 transition-colors"
          aria-label="Attach image"
        >
          <ImagePlus className="w-5 h-5" />
        </button>

        <textarea
          value={text}
          onChange={handleTextChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder={selectedFile ? "Add a caption (optional)..." : "Type a message..."}
          rows={1}
          className="flex-1 resize-none max-h-32 px-4 py-2.5 rounded-xl bg-ink-900/[0.04] text-sm text-ink-900
            placeholder:text-ink-900/35 outline-none focus:bg-ink-900/[0.06] transition-colors"
        />

        <button
          type="submit"
          disabled={(!text.trim() && !selectedFile) || isSending || isUploadingImage}
          className="w-10 h-10 shrink-0 rounded-xl bg-signal-500 text-white flex items-center justify-center
            disabled:opacity-30 disabled:cursor-not-allowed hover:bg-signal-400 transition-colors"
          aria-label="Send message"
        >
          {isSending || isUploadingImage ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </form>
  );
}
