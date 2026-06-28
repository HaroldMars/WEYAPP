import { useState } from "react";
import { API_URL } from "../api/client.js";
import { formatMessageTime } from "../utils/time.js";

export default function MessageBubble({ message, isOwn, showSenderName = false }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const imageSrc = message.image
    ? message.image.startsWith("http")
      ? message.image
      : `${API_URL}${message.image}`
    : null;

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-pop-in`}>
      <div className={`max-w-[72%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {showSenderName && !isOwn && (
          <span className="text-[11px] font-semibold text-ink-900/45 mb-1 px-1">
            {message.sender.nickname || message.sender.name}
          </span>
        )}
        <div
          className={`overflow-hidden shadow-bubble
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
                onClick={() => setLightboxOpen(true)}
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
    </div>
  );
}
