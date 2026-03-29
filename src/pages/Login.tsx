import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { ArrowLeft } from 'lucide-react'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/app'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const { error: e2 } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (e2) {
      setError(e2.message)
      return
    }
    navigate(from, { replace: true })
  }

  if (!supabaseConfigured) {
    return (
      <div className="auth-page">
        <div className="card narrow">
          <h1>Supabase ist nicht konfiguriert</h1>
          <p className="muted">
            Lege im Projektroot eine <code>.env</code> mit <code>VITE_SUPABASE_URL</code> und{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> (oder <code>VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY</code>)
            an — Details stehen in der README.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={18} /> Zur Startseite
      </Link>
      <div className="card narrow">
        <h1>Willkommen zurück</h1>
        <p className="muted small">Melde dich mit deiner E-Mail und deinem Passwort an.</p>
        <form onSubmit={submit} className="form">
          <label>
            E-Mail
            <input
              type="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Passwort
            <input
              type="password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn primary block" disabled={busy}>
            {busy ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>
        <p className="muted small">
          Noch kein Konto? <Link to="/register">Jetzt registrieren</Link>
        </p>
      </div>
    </div>
  )
}
