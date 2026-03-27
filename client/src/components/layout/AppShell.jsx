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

const sidebarInner = {
  width: 210,
  flexShrink: 0,
  background: "#111",
  borderRight: "1px solid #1e1e1e",
  flexDirection: "column", // no display here — Tailwind controls that
  height: "100%",
};

export default function AppShell() {
  const { logout } = useAuth();
  const [showLog, setShowLog] = useState(false);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#0f0f0f" }}
    >
      {/* Sidebar — lg+ only. NO inline display property. */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0"
        style={{
          width: 210,
          background: "#111",
          borderRight: "1px solid #1e1e1e",
        }}
      >
        <div
          style={{
            padding: "22px 20px 18px",
            borderBottom: "1px solid #1e1e1e",
          }}
        >
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22,
              fontWeight: 600,
              color: "#f0f0f0",
              margin: 0,
              lineHeight: 1,
            }}
          >
            ScaleUp!
          </h1>
          <p style={{ fontSize: 11, color: "#444", marginTop: 4 }}>
            piano practice tracker
          </p>
        </div>

        <nav
          className="flex flex-col flex-1 overflow-y-auto"
          style={{ padding: "12px 10px", gap: 2 }}
        >
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `nav-item ${isActive ? "nav-item-active" : ""}`
              }
            >
              <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>
                {icon}
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div
          className="flex flex-col"
          style={{
            padding: "12px 10px",
            borderTop: "1px solid #1e1e1e",
            gap: 8,
          }}
        >
          <button
            onClick={() => setShowLog(true)}
            className="btn-primary"
            style={{ width: "100%" }}
          >
            + Log Session
          </button>
          <button
            onClick={logout}
            style={{
              fontSize: 11,
              color: "#444",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 0",
            }}
            onMouseEnter={(e) => (e.target.style.color = "#888")}
            onMouseLeave={(e) => (e.target.style.color = "#444")}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Mobile topbar — below lg only. NO inline display property. */}
        <div
          className="flex lg:hidden items-center justify-between"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "#111",
            borderBottom: "1px solid #1e1e1e",
            padding: "12px 16px",
          }}
        >
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 20,
              fontWeight: 600,
              color: "#f0f0f0",
              margin: 0,
            }}
          >
            ScaleUp!
          </h1>
          <button
            onClick={() => setShowLog(true)}
            className="btn-primary"
            style={{ padding: "7px 14px", fontSize: 12 }}
          >
            + Log
          </button>
        </div>

        <Outlet context={{ openLogSession: () => setShowLog(true) }} />
      </main>

      {/* Bottom nav — below lg only. NO inline display property. */}
      <nav
        className="flex lg:hidden items-center justify-around"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          background: "#111",
          borderTop: "1px solid #1e1e1e",
          paddingTop: 8,
          paddingLeft: 8,
          paddingRight: 8,
          paddingBottom: "max(8px, env(safe-area-inset-bottom))",
        }}
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
            <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
            <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
          </NavLink>
        ))}
      </nav>

      {showLog && (
        <LogSessionModal onClose={() => setShowLog(false)} onSaved={() => {}} />
      )}
    </div>
  );
}
