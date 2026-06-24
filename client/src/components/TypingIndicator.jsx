export default function TypingIndicator() {
  return (
    <div className="flex justify-start animate-pop-in">
      <div className="bg-white rounded-2xl rounded-bl-md shadow-bubble px-4 py-3 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-ink-900/30 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-ink-900/30 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-ink-900/30 animate-bounce" />
      </div>
    </div>
  );
}
