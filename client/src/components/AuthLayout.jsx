import { MessageCircle } from "lucide-react";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-signal-500 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl text-ink-900">Hearth</span>
        </div>

        <div className="bg-white rounded-xl2 shadow-bubble p-8 animate-pop-in">
          <h1 className="font-display font-bold text-2xl text-ink-900 mb-1">{title}</h1>
          {subtitle && <p className="text-ink-900/55 text-sm mb-6">{subtitle}</p>}
          {!subtitle && <div className="mb-6" />}
          {children}
        </div>
      </div>
    </div>
  );
}
