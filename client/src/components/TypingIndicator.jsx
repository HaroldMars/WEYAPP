export default function TypingIndicator({ name }) {
  return (
    <div className="flex flex-col items-start animate-pop-in">
      {name && <span className="text-[11px] font-semibold text-ink-900/45 mb-1 px-1">{name}</span>}
      <div className="bg-white rounded-2xl rounded-bl-md shadow-bubble px-4 py-3 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-ink-900/30 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-ink-900/30 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-ink-900/30 animate-bounce" />
      </div>
    </div>
  );
}
