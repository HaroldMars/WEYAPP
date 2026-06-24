import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Settings, User, LogOut, MessageCircle } from "lucide-react";
import Avatar from "./Avatar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function NavRail() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-16 bg-ink-950 flex flex-col items-center py-4 justify-between shrink-0">
      <Link to="/" className="w-10 h-10 rounded-xl bg-signal-500 flex items-center justify-center">
        {/* <MessageCircle className="w-5 h-5 text-white" strokeWidth={2.5} /> */}<p className="text-white font-bold text-2xl">!</p>
      </Link>

      <div className="relative" ref={menuRef}>
        {menuOpen && (
          <div className="absolute bottom-14 left-0 w-44 bg-white rounded-xl shadow-bubble py-1.5 animate-pop-in">
            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-900 hover:bg-ink-900/[0.04]"
            >
              <User className="w-4 h-4 text-ink-900/50" />
              Profile
            </Link>
            <Link
              to="/settings"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-900 hover:bg-ink-900/[0.04]"
            >
              <Settings className="w-4 h-4 text-ink-900/50" />
              Settings
            </Link>
            <div className="h-px bg-ink-900/[0.06] my-1" />
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-coral-500 hover:bg-coral-500/5"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        )}
        <button onClick={() => setMenuOpen((o) => !o)} className="block">
          <Avatar name={user?.name} avatar={user?.avatar} size="md" />
        </button>
      </div>
    </div>
  );
}
