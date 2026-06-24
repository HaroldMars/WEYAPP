import { useNavigate } from "react-router-dom";
import { LogOut, User, ChevronRight } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Avatar from "../components/Avatar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-paper-50">
      <PageHeader title="Settings" />

      <div className="max-w-md mx-auto px-6 py-8">
        <button
          onClick={() => navigate("/profile")}
          className="w-full flex items-center gap-3 px-4 py-4 rounded-xl bg-white shadow-bubble mb-6
            hover:bg-ink-900/[0.02] transition-colors text-left"
        >
          <Avatar name={user?.name} avatar={user?.avatar} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-sm text-ink-900 truncate">{user?.name}</p>
            <p className="text-xs text-ink-900/40 truncate">{user?.email}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-ink-900/30 shrink-0" />
        </button>

        <div className="bg-white rounded-xl shadow-bubble overflow-hidden">
          <button
            onClick={() => navigate("/profile")}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-ink-900/[0.02] transition-colors text-left"
          >
            <User className="w-4.5 h-4.5 text-ink-900/50" />
            <span className="text-sm text-ink-900 flex-1">Edit profile</span>
            <ChevronRight className="w-4 h-4 text-ink-900/30" />
          </button>

          <div className="h-px bg-ink-900/[0.06]" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-coral-500/5 transition-colors text-left"
          >
            <LogOut className="w-4.5 h-4.5 text-coral-500" />
            <span className="text-sm text-coral-500 font-medium flex-1">Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
