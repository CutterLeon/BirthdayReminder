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
          <h1>Konfiguration fehlt</h1>
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
        <h1>Freischaltung</h1>
        <p className="muted">
          Nach erfolgreicher Zahlung wird dein Konto per Stripe-Webhook automatisch aktiv. Preis
          und Stripe-Preis-ID kommen aus dem Supabase-Secret <code>STRIPE_PRICE_ID</code>.
        </p>
        {error && <p className="error">{error}</p>}
        <button
          type="button"
          className="btn primary block"
          onClick={() => void startCheckout()}
          disabled={busy}
        >
          {busy ? 'Weiterleitung…' : 'Mit Stripe bezahlen'}
        </button>
        {!session && (
          <p className="muted small">Du musst angemeldet sein, um zu zahlen.</p>
        )}
      </div>
    </div>
  )
}
