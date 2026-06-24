import { API_URL } from "../api/client.js";

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-11 h-11 text-sm",
  lg: "w-16 h-16 text-lg",
  xl: "w-24 h-24 text-2xl",
};

const dotSizeMap = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3.5 h-3.5",
  xl: "w-4 h-4",
};

const resolveSrc = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith("http")) return avatar;
  return `${API_URL}${avatar}`;
};

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

export default function Avatar({ name, avatar, size = "md", isOnline, showStatus = false }) {
  const src = resolveSrc(avatar);

  return (
    <div className={`relative shrink-0 ${sizeMap[size]}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`w-full h-full rounded-full object-cover ring-2 ring-white`}
        />
      ) : (
        <div
          className={`w-full h-full rounded-full bg-signal-500/15 text-signal-500 ring-2 ring-white
            flex items-center justify-center font-display font-semibold`}
        >
          {initials(name) || "?"}
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${dotSizeMap[size]} rounded-full ring-2 ring-white
            ${isOnline ? "bg-mint-500" : "bg-ink-900/25"}`}
        >
          {isOnline && (
            <span className="block w-full h-full rounded-full bg-mint-500 animate-pulse-dot" />
          )}
        </span>
      )}
    </div>
  );
}
