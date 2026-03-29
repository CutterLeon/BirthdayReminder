import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { ArrowLeft } from 'lucide-react'

export function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const { error: e2 } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    setBusy(false)
    if (e2) {
      setError(e2.message)
      return
    }
    navigate('/pricing')
  }

  if (!supabaseConfigured) {
    return (
      <div className="auth-page">
        <div className="card narrow">
          <h1>Konfiguration fehlt</h1>
          <p className="muted">Siehe README für <code>.env</code>.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={18} /> Start
      </Link>
      <div className="card narrow">
        <h1>Registrieren</h1>
        <form onSubmit={submit} className="form">
          <label>
            Name
            <input
              value={fullName}
              onChange={(ev) => setFullName(ev.target.value)}
              autoComplete="name"
            />
          </label>
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
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn primary block" disabled={busy}>
            {busy ? '…' : 'Konto anlegen'}
          </button>
        </form>
        <p className="muted small">
          Bereits dabei? <Link to="/login">Anmelden</Link>
        </p>
      </div>
    </div>
  )
}
