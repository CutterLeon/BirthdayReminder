import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSession } from '../hooks/useSession'
import { useProfile } from '../hooks/useProfile'
import { COMMON_TIMEZONES } from '../lib/timezones'
import type { Database } from '../lib/database.types'

type Row = Database['public']['Tables']['birthday_contacts']['Row']

const empty = {
  display_name: '',
  birth_month: 1,
  birth_day: 1,
  birth_year: '' as string | number,
  timezone: 'Europe/Berlin',
  city: '',
  country: '',
  notify_email: true,
}

export function Birthdays() {
  const { user } = useSession()
  const { profile } = useProfile(user?.id)
  const [rows, setRows] = useState<Row[]>([])
  const [form, setForm] = useState(empty)
  const [error, setError] = useState<string | null>(null)
  const [geoBusy, setGeoBusy] = useState(false)

  const canWrite = profile?.is_active || profile?.role === 'admin'

  const load = async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from('birthday_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('birth_month')
      .order('birth_day')
    setRows(data ?? [])
  }

  useEffect(() => {
    void load()
  }, [user?.id])

  const resolveTz = async () => {
    setGeoBusy(true)
    setError(null)
    const { data, error: e } = await supabase.functions.invoke('resolve-timezone', {
      body: { city: form.city, country: form.country || undefined },
    })
    setGeoBusy(false)
    if (e) {
      setError(e.message)
      return
    }
    const tz = (data as { timezone?: string | null })?.timezone
    if (tz) setForm((f) => ({ ...f, timezone: tz }))
    else setError('Ort nicht gefunden — bitte Zeitzone manuell wählen.')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !canWrite) return
    setError(null)
    const yearStr = String(form.birth_year).trim()
    const birth_year = yearStr ? Number(yearStr) : null
    const { error: e2 } = await supabase.from('birthday_contacts').insert({
      user_id: user.id,
      display_name: form.display_name.trim(),
      birth_month: Number(form.birth_month),
      birth_day: Number(form.birth_day),
      birth_year,
      timezone: form.timezone,
      city: form.city.trim() || null,
      country: form.country.trim() || null,
      notify_email: form.notify_email,
    })
    if (e2) {
      setError(e2.message)
      return
    }
    setForm(empty)
    await load()
  }

  const remove = async (id: string) => {
    if (!canWrite) return
    await supabase.from('birthday_contacts').delete().eq('id', id)
    await load()
  }

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Geburtstage</h1>
        <p className="muted">
          E-Mail-Erinnerungen um 06:00 in der <strong>Zeitzone des Kontakts</strong> (nicht GPS live —
          Ort einmal erfassen oder Zeitzone wählen).
        </p>
      </div>

      {!canWrite && (
        <div className="banner subtle">
          Konto nicht freigeschaltet — Geburtstage sind schreibgeschützt.
        </div>
      )}

      <div className="card">
        <h2>Kontakt anlegen</h2>
        <form className="form-grid" onSubmit={submit}>
          <label className="span-2">
            Anzeigename
            <input
              value={form.display_name}
              onChange={(ev) => setForm({ ...form, display_name: ev.target.value })}
              required
              disabled={!canWrite}
            />
          </label>
          <label>
            Tag
            <input
              type="number"
              min={1}
              max={31}
              value={form.birth_day}
              onChange={(ev) =>
                setForm({ ...form, birth_day: Number(ev.target.value) })
              }
              disabled={!canWrite}
            />
          </label>
          <label>
            Monat
            <input
              type="number"
              min={1}
              max={12}
              value={form.birth_month}
              onChange={(ev) =>
                setForm({ ...form, birth_month: Number(ev.target.value) })
              }
              disabled={!canWrite}
            />
          </label>
          <label>
            Jahr (optional)
            <input
              type="number"
              placeholder="z. B. 1990"
              value={form.birth_year}
              onChange={(ev) => setForm({ ...form, birth_year: ev.target.value })}
              disabled={!canWrite}
            />
          </label>
          <label className="span-2">
            Stadt (für Zeitzonen-Vorschlag)
            <input
              value={form.city}
              onChange={(ev) => setForm({ ...form, city: ev.target.value })}
              disabled={!canWrite}
            />
          </label>
          <label>
            Land (optional)
            <input
              value={form.country}
              onChange={(ev) => setForm({ ...form, country: ev.target.value })}
              disabled={!canWrite}
            />
          </label>
          <div className="row align-end">
            <button
              type="button"
              className="btn secondary"
              disabled={!canWrite || geoBusy}
              onClick={() => void resolveTz()}
            >
              {geoBusy ? '…' : 'Zeitzone vorschlagen'}
            </button>
          </div>
          <label className="span-2">
            Zeitzone (IANA)
            <select
              value={form.timezone}
              onChange={(ev) => setForm({ ...form, timezone: ev.target.value })}
              disabled={!canWrite}
            >
              {COMMON_TIMEZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </label>
          <label className="span-2 row gap align-center">
            <input
              type="checkbox"
              checked={form.notify_email}
              onChange={(ev) =>
                setForm({ ...form, notify_email: ev.target.checked })
              }
              disabled={!canWrite}
            />
            E-Mail-Erinnerung (06:00 lokale Zeit des Kontakts)
          </label>
          <div className="span-2">
            <button type="submit" className="btn primary" disabled={!canWrite}>
              Speichern
            </button>
          </div>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        <h2>Einträge</h2>
        <ul className="list-tight">
          {rows.map((r) => (
            <li key={r.id} className="birthday-row">
              <div>
                <strong>{r.display_name}</strong>{' '}
                <span className="muted small">
                  {String(r.birth_day).padStart(2, '0')}.{String(r.birth_month).padStart(2, '0')}
                  {r.birth_year ? `.${r.birth_year}` : ''} · {r.timezone}
                </span>
                {r.notify_email ? (
                  <span className="badge ok small">E-Mail</span>
                ) : (
                  <span className="badge muted small">Kein Mail</span>
                )}
              </div>
              <button
                type="button"
                className="btn ghost small danger"
                onClick={() => void remove(r.id)}
                disabled={!canWrite}
              >
                Löschen
              </button>
            </li>
          ))}
        </ul>
        {rows.length === 0 && <p className="muted">Noch keine Geburtstage.</p>}
      </div>
    </div>
  )
}
