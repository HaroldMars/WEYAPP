import { NavLink, Outlet } from "react-router-dom";
import { MessageCircle, Plus, FileText, Menu } from "lucide-react";
import { useState } from "react";
import AddMenu from "./AddMenu.jsx";

const tabs = [
  { to: "/", label: "Chats", icon: MessageCircle, end: true },
  { to: "/posts", label: "Post", icon: FileText },
  { to: "/menu", label: "Menu", icon: Menu },
];

export default function MobileShell() {
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  return (
    <div className="h-screen w-full flex flex-col bg-paper-50 max-w-md mx-auto relative overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      <nav className="shrink-0 bg-white border-t border-ink-900/[0.06] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around px-2 py-2">
          <TabLink {...tabs[0]} />

          <button
            onClick={() => setAddMenuOpen(true)}
            className="flex flex-col items-center gap-1 px-4 py-1.5 -mt-4"
            aria-label="Add"
          >
            <span className="w-12 h-12 rounded-full bg-coral-500 text-white flex items-center justify-center shadow-bubble">
              <Plus className="w-6 h-6" strokeWidth={2.5} />
            </span>
            <span className="text-[11px] font-medium text-ink-900/60">Add</span>
          </button>

          <TabLink {...tabs[1]} />
          <TabLink {...tabs[2]} />
        </div>
      </nav>

      {addMenuOpen && <AddMenu onClose={() => setAddMenuOpen(false)} />}
    </div>
  );
}

function TabLink({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 px-4 py-1.5 ${
          isActive ? "text-signal-500" : "text-ink-900/45"
        }`
      }
    >
      <Icon className="w-6 h-6" strokeWidth={2} />
      <span className="text-[11px] font-medium">{label}</span>
    </NavLink>
  );
}
