import { Outlet, NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import LogSessionModal from "../sessions/LogSessionModal.jsx";

const NAV = [
  { to: "/", label: "Home", icon: "⌂" },
  { to: "/sessions", label: "Sessions", icon: "📅" },
  { to: "/repertoire", label: "Pieces", icon: "🎼" },
  { to: "/goals", label: "Goals", icon: "🎯" },
  { to: "/stats", label: "Stats", icon: "📈" },
];

export default function AppShell() {
  const { logout } = useAuth();
  const [showLog, setShowLog] = useState(false);

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex w-52 flex-shrink-0 bg-white border-r border-stone-200 flex-col">
        <div className="px-5 py-5 border-b border-stone-100">
          <h1 className="font-display text-xl text-stone-900 leading-none">
            ScaleUp!
          </h1>
          <p className="text-xs text-stone-400 mt-1">piano practice tracker</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `nav-item ${isActive ? "nav-item-active" : ""}`
              }
            >
              <span className="text-base w-5 text-center">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-stone-100 space-y-2">
          <button
            onClick={() => setShowLog(true)}
            className="w-full btn-primary text-center"
          >
            + Log Session
          </button>
          <button
            onClick={logout}
            className="w-full text-xs text-stone-400 hover:text-stone-600 py-1 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
          <h1 className="font-display text-lg text-stone-900">ScaleUp!</h1>
          <button
            onClick={() => setShowLog(true)}
            className="bg-amber-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg active:scale-95 transition-transform touch-manipulation"
          >
            + Log
          </button>
        </div>
        <Outlet context={{ openLogSession: () => setShowLog(true) }} />
      </main>

      {/* Bottom nav — mobile only */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-stone-200 px-2 pb-safe flex items-center justify-around"
        style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
      >
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? "active" : ""}`
            }
          >
            <span className="text-xl leading-none">{icon}</span>
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      {showLog && (
        <LogSessionModal onClose={() => setShowLog(false)} onSaved={() => {}} />
      )}
    </div>
  );
}
