import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { supabaseConfigured } from '../lib/supabase'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession()
  const location = useLocation()

  if (!supabaseConfigured) {
    return (
      <div className="card narrow">
        <h1>Konfiguration</h1>
        <p>
          Bitte <code>.env</code> mit <code>VITE_SUPABASE_URL</code> und{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> anlegen.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="center muted" style={{ padding: '3rem' }}>
        Laden…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
