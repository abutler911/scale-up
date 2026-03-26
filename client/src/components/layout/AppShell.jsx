import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import LogSessionModal from '../sessions/LogSessionModal.jsx'

const NAV = [
  { to: '/',           label: 'Dashboard',  icon: '⌂' },
  { to: '/sessions',   label: 'Sessions',   icon: '📅' },
  { to: '/repertoire', label: 'Repertoire', icon: '🎼' },
  { to: '/goals',      label: 'Goals',      icon: '🎯' },
  { to: '/stats',      label: 'Stats',      icon: '📈' }
]

export default function AppShell() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [showLog, setShowLog] = useState(false)

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 bg-white border-r border-stone-200 flex flex-col">
        <div className="px-5 py-5 border-b border-stone-100">
          <h1 className="font-display text-xl text-stone-900 leading-none">ScaleUp!</h1>
          <p className="text-xs text-stone-400 mt-1">piano practice tracker</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
            >
              <span className="text-base w-5 text-center">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-stone-100 space-y-1">
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
      <main className="flex-1 overflow-auto">
        <Outlet context={{ openLogSession: () => setShowLog(true) }} />
      </main>

      {showLog && <LogSessionModal onClose={() => setShowLog(false)} />}
    </div>
  )
}
