import { Link, NavLink, Outlet } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { useProfile } from '../hooks/useProfile'
import { useTauriReminders } from '../hooks/useTauriReminders'
import { supabase } from '../lib/supabase'
import {
  CalendarClock,
  CalendarDays,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Settings as SettingsIcon,
  Shield,
  Sparkles,
} from 'lucide-react'

export function Layout() {
  const { user } = useSession()
  const { profile } = useProfile(user?.id)
  const remindersOn = Boolean(
    profile && (profile.is_active || profile.role === 'admin'),
  )
  useTauriReminders(remindersOn)

  const signOut = () => {
    void supabase.auth.signOut()
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'nav-link active' : 'nav-link'

  const inactive = profile && !profile.is_active && profile.role !== 'admin'

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/app" className="brand">
          <Sparkles size={22} strokeWidth={1.75} />
          <span>Organizer</span>
        </Link>
        <nav className="nav-main">
          <NavLink to="/app" end className={navClass}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink to="/app/tasks" className={navClass}>
            <ListTodo size={18} /> Aufgaben
          </NavLink>
          <NavLink to="/app/plan" className={navClass}>
            <CalendarClock size={18} /> Daily Plan
          </NavLink>
          <NavLink to="/app/birthdays" className={navClass}>
            <CalendarDays size={18} /> Geburtstage
          </NavLink>
          <NavLink to="/app/settings" className={navClass}>
            <SettingsIcon size={18} /> Einstellungen
          </NavLink>
          {profile?.role === 'admin' && (
            <NavLink to="/app/admin" className={navClass}>
              <Shield size={18} /> Admin
            </NavLink>
          )}
        </nav>
        <div className="topbar-actions">
          <button type="button" className="btn ghost" onClick={signOut}>
            <LogOut size={18} /> Abmelden
          </button>
        </div>
      </header>
      {inactive && (
        <div className="banner">
          <strong>Konto noch nicht freigeschaltet.</strong> Schließe das Abonnement ab,{' '}
          <Link to="/pricing">zur Zahlung</Link>.
        </div>
      )}
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
