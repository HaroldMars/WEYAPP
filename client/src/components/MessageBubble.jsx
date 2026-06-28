import { useState, useRef, useCallback } from "react";
import { Trash2, X } from "lucide-react";
import { API_URL } from "../api/client.js";
import { formatMessageTime } from "../utils/time.js";

const LONG_PRESS_MS = 450;

export default function MessageBubble({ message, isOwn, showSenderName = false, onDelete }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const pressTimer = useRef(null);
  const longPressTriggered = useRef(false);

  const imageSrc = message.image
    ? message.image.startsWith("http")
      ? message.image
      : `${API_URL}${message.image}`
    : null;

  const startPress = useCallback(() => {
    if (!isOwn || message.deletedForEveryone) return;
    longPressTriggered.current = false;
    pressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setShowDeleteSheet(true);
    }, LONG_PRESS_MS);
  }, [isOwn, message.deletedForEveryone]);

  const cancelPress = useCallback(() => {
    clearTimeout(pressTimer.current);
  }, []);

  // Prevent a long-press from also triggering the image lightbox click right after
  const handleImageClick = (e) => {
    if (longPressTriggered.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setLightboxOpen(true);
  };

  const handleDeleteForMe = () => {
    setShowDeleteSheet(false);
    onDelete?.(message.id, "me");
  };

  const handleDeleteForEveryone = () => {
    setShowDeleteSheet(false);
    onDelete?.(message.id, "everyone");
  };

  if (message.deletedForEveryone) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-pop-in`}>
        <div className={`max-w-[72%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
          <div className="px-4 py-2.5 rounded-2xl bg-ink-900/[0.04] italic text-sm text-ink-900/40">
            This message was deleted
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-pop-in`}>
      <div className={`max-w-[72%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {showSenderName && !isOwn && (
          <span className="text-[11px] font-semibold text-ink-900/45 mb-1 px-1">
            {message.sender.nickname || message.sender.name}
          </span>
        )}
        <div
          onMouseDown={startPress}
          onMouseUp={cancelPress}
          onMouseLeave={cancelPress}
          onTouchStart={startPress}
          onTouchEnd={cancelPress}
          className={`overflow-hidden shadow-bubble select-none
            ${
              isOwn
                ? "bg-signal-500 text-white rounded-2xl rounded-br-md"
                : "bg-white text-ink-900 rounded-2xl rounded-bl-md"
            }
            ${message.image ? "p-1" : "px-4 py-2.5"}`}
        >
          {imageSrc && (
            <>
              {!imageLoaded && (
                <div className="w-56 h-40 rounded-xl bg-ink-900/5 animate-pulse" />
              )}
              <img
                src={imageSrc}
                alt="Shared image"
                onLoad={() => setImageLoaded(true)}
                onClick={handleImageClick}
                className={`max-w-full max-h-72 rounded-xl object-cover cursor-zoom-in ${
                  imageLoaded ? "block" : "hidden"
                }`}
              />
            </>
          )}
          {message.text && (
            <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${message.image ? "px-2.5 py-1.5" : ""}`}>
              {message.text}
            </p>
          )}
        </div>
        <span className="text-[11px] text-ink-900/35 mt-1 px-1">
          {formatMessageTime(message.createdAt)}
        </span>
      </div>

      {lightboxOpen && imageSrc && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 cursor-zoom-out"
          onClick={() => setLightboxOpen(false)}
        >
          <img src={imageSrc} alt="Shared image full size" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}

      {showDeleteSheet && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center"
          onClick={() => setShowDeleteSheet(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-t-2xl pb-6 pt-2 animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-ink-900/15 mx-auto my-2" />
            <button
              onClick={handleDeleteForMe}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-ink-900/[0.03]"
            >
              <Trash2 className="w-4.5 h-4.5 text-ink-900/50" />
              <span className="text-sm text-ink-900">Delete for me</span>
            </button>
            <button
              onClick={handleDeleteForEveryone}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-coral-500/5"
            >
              <Trash2 className="w-4.5 h-4.5 text-coral-500" />
              <span className="text-sm text-coral-500 font-medium">Delete for everyone</span>
            </button>
            <button
              onClick={() => setShowDeleteSheet(false)}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 mt-1 text-left"
            >
              <X className="w-4 h-4 text-ink-900/40" />
              <span className="text-sm text-ink-900/60">Cancel</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
