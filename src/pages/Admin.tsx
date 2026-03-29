import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSession } from '../hooks/useSession'
import { useProfile } from '../hooks/useProfile'
import type { Database } from '../lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export function Admin() {
  const { user } = useSession()
  const { profile, loading } = useProfile(user?.id)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [invite, setInvite] = useState({
    email: '',
    full_name: '',
    password: '',
    make_admin: false,
  })
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    setProfiles(data ?? [])
  }

  useEffect(() => {
    if (profile?.role === 'admin') void load()
  }, [profile?.role])

  if (!loading && profile?.role !== 'admin') {
    return <Navigate to="/app" replace />
  }

  const toggleActive = async (p: Profile) => {
    setErr(null)
    const { error: e } = await supabase
      .from('profiles')
      .update({ is_active: !p.is_active })
      .eq('id', p.id)
    if (e) setErr(e.message)
    await load()
  }

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    setMsg(null)
    const { data, error: fnErr } = await supabase.functions.invoke('admin-invite-user', {
      body: {
        email: invite.email.trim(),
        full_name: invite.full_name.trim(),
        password: invite.password.trim() || undefined,
        make_admin: invite.make_admin,
      },
    })
    setBusy(false)
    if (fnErr) {
      setErr(fnErr.message)
      return
    }
    const tmp = (data as { temporary_password?: string })?.temporary_password
    setMsg(
      tmp
        ? `Nutzer angelegt. Temporäres Passwort: ${tmp}`
        : 'Nutzer angelegt und freigeschaltet.',
    )
    setInvite({ email: '', full_name: '', password: '', make_admin: false })
    await load()
  }

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Administration</h1>
        <p className="muted">Nutzer einladen und Konten manuell freischalten.</p>
      </div>

      <div className="card">
        <h2>Einladung / manuelles Konto</h2>
        <form className="form-grid" onSubmit={sendInvite}>
          <label className="span-2">
            E-Mail
            <input
              type="email"
              value={invite.email}
              onChange={(ev) => setInvite({ ...invite, email: ev.target.value })}
              required
            />
          </label>
          <label className="span-2">
            Name
            <input
              value={invite.full_name}
              onChange={(ev) => setInvite({ ...invite, full_name: ev.target.value })}
            />
          </label>
          <label className="span-2">
            Passwort (leer = automatisch generiert)
            <input
              type="text"
              autoComplete="new-password"
              value={invite.password}
              onChange={(ev) => setInvite({ ...invite, password: ev.target.value })}
            />
          </label>
          <label className="span-2 row gap align-center">
            <input
              type="checkbox"
              checked={invite.make_admin}
              onChange={(ev) =>
                setInvite({ ...invite, make_admin: ev.target.checked })
              }
            />
            Als Admin anlegen
          </label>
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? '…' : 'Anlegen und aktivieren'}
          </button>
        </form>
        {msg && <p className="ok">{msg}</p>}
        {err && <p className="error">{err}</p>}
      </div>

      <div className="card">
        <h2>Alle Profile</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>E-Mail</th>
                <th>Rolle</th>
                <th>Aktiv</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id}>
                  <td>{p.email}</td>
                  <td>{p.role}</td>
                  <td>{p.is_active ? 'ja' : 'nein'}</td>
                  <td>
                    <button
                      type="button"
                      className="btn secondary small"
                      onClick={() => void toggleActive(p)}
                    >
                      Aktiv umschalten
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card muted small">
        <p>
          Ersten Admin festlegen: in der Supabase-SQL-Konsole{' '}
          <code>
            update profiles set role = &apos;admin&apos;, is_active = true where email =
            &apos;du@example.com&apos;;
          </code>
        </p>
      </div>
    </div>
  )
}
