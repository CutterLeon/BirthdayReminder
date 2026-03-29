import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { useSession } from '../hooks/useSession'
import { ArrowLeft } from 'lucide-react'

const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

export function Pricing() {
  const { session } = useSession()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const startCheckout = async () => {
    if (!session) {
      navigate('/login', { state: { from: '/pricing' } })
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'create-checkout-session',
        { method: 'POST' },
      )
      if (fnError) throw fnError
      const url = (data as { url?: string })?.url
      if (!url) throw new Error('Keine Checkout-URL')
      if (pk) await loadStripe(pk)
      window.location.href = url
    } catch (e) {
      setError(String(e))
      setBusy(false)
    }
  }

  if (!supabaseConfigured) {
    return (
      <div className="auth-page">
        <div className="card narrow">
          <h1>Supabase ist nicht konfiguriert</h1>
          <p className="muted small">Siehe README für die nötigen Umgebungsvariablen.</p>
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
        <h1>Organizer freischalten</h1>
        <p className="muted">
          Mit sicherer Zahlung über Stripe wird dein Konto kurz nach dem Kauf automatisch aktiviert.
          Danach kannst du Aufgaben und Geburtstage anlegen und bearbeiten.
        </p>
        {error && <p className="error">{error}</p>}
        <button
          type="button"
          className="btn primary block"
          onClick={() => void startCheckout()}
          disabled={busy}
        >
          {busy ? 'Weiter zum Checkout…' : 'Jetzt bezahlen und freischalten'}
        </button>
        {!session && (
          <p className="muted small">Bitte melde dich an, bevor du zur Zahlung gehst.</p>
        )}
      </div>
    </div>
  )
}
