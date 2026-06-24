import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PageHeader({ title }) {
  return (
    <div className="flex items-center gap-3 px-6 py-5 border-b border-ink-900/[0.06] bg-white">
      <Link
        to="/"
        className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-900/50 hover:bg-ink-900/5 transition-colors"
      >
        <ArrowLeft className="w-4.5 h-4.5" />
      </Link>
      <h1 className="font-display font-bold text-lg text-ink-900">{title}</h1>
    </div>
  );
}
