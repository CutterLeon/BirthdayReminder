import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { useSession } from '../hooks/useSession'
import { useProfile } from '../hooks/useProfile'
import { COMMON_TIMEZONES } from '../lib/timezones'
import { Link } from 'react-router-dom'
import type { Database } from '../lib/database.types'

type Task = Database['public']['Tables']['tasks']['Row']
type Birthday = Database['public']['Tables']['birthday_contacts']['Row']

export function Dashboard() {
  const { user } = useSession()
  const { profile, refresh } = useProfile(user?.id)
  const [tasks, setTasks] = useState<Task[]>([])
  const [birthdays, setBirthdays] = useState<Birthday[]>([])
  const [tzDraft, setTzDraft] = useState(profile?.default_timezone ?? 'Europe/Berlin')

  useEffect(() => {
    if (profile?.default_timezone) setTzDraft(profile.default_timezone)
  }, [profile?.default_timezone])

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      const { data: t } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_at', { ascending: true, nullsFirst: false })
      setTasks(t ?? [])
      const { data: b } = await supabase.from('birthday_contacts').select('*').eq('user_id', user.id)
      setBirthdays(b ?? [])
    }
    void load()
  }, [user?.id])

  const total = tasks.length
  const done = tasks.filter((t) => t.completed_at).length
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  const openTasks = tasks.filter((t) => !t.completed_at)
  const overdue = openTasks.filter(
    (t) => t.due_at && new Date(t.due_at) < new Date(),
  )
  const high = openTasks.filter((t) => t.priority === 'high')

  const now = new Date()
  const bToday = birthdays.filter((b) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: b.timezone,
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(now)
    const m = Number(parts.find((p) => p.type === 'month')?.value)
    const d = Number(parts.find((p) => p.type === 'day')?.value)
    return m === b.birth_month && d === b.birth_day
  })

  const saveTz = async () => {
    if (!user?.id) return
    await supabase.from('profiles').update({ default_timezone: tzDraft }).eq('id', user.id)
    await refresh()
  }

  const canUse = profile?.is_active || profile?.role === 'admin'

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Überblick</h1>
        <p className="muted">
          Fortschritt bei den Aufgaben, dringende Termine und Geburtstage von heute.
        </p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Aufgaben-Fortschritt</h2>
          <div className="progress-wrap">
            <div className="progress-ring" style={{ '--p': pct } as React.CSSProperties}>
              <span>{pct}%</span>
            </div>
            <div>
              <p className="stat">
                <strong>{done}</strong> erledigt von <strong>{total}</strong>
              </p>
              <p className="muted small">
                Noch offen: <strong>{total - done}</strong>
              </p>
            </div>
          </div>
          {!canUse && (
            <p className="muted small">
              Nach der Freischaltung kannst du hier neue Aufgaben anlegen.{' '}
              <Link to="/pricing">Jetzt freischalten</Link>
            </p>
          )}
        </div>

        <div className="card">
          <h2>Standard-Zeitzone</h2>
          <p className="muted small">
            Wird für dein Profil gespeichert (z. B. künftige Tagesübersichten). Geburtstags-E-Mails
            richten sich jeweils nach der Zeitzone des einzelnen Kontakts.
          </p>
          <div className="row">
            <select
              value={tzDraft}
              onChange={(e) => setTzDraft(e.target.value)}
              className="grow"
            >
              {COMMON_TIMEZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
            <button type="button" className="btn secondary" onClick={() => void saveTz()}>
              Speichern
            </button>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Dringend &amp; überfällig</h2>
          {high.length === 0 && overdue.length === 0 ? (
            <p className="muted">Nichts Kritisches — gut gemacht.</p>
          ) : (
            <ul className="list-tight">
              {high.map((t) => (
                <li key={t.id}>
                  <span className="badge high">Hoch</span> {t.title}
                  {t.due_at && (
                    <span className="muted small">
                      {' '}
                      · {format(new Date(t.due_at), 'dd. MMM HH:mm', { locale: de })}
                    </span>
                  )}
                </li>
              ))}
              {overdue.map((t) => (
                <li key={t.id}>
                  <span className="badge warn">Überfällig</span> {t.title}
                </li>
              ))}
            </ul>
          )}
          <Link to="/app/tasks" className="btn ghost small">
            Alle Aufgaben
          </Link>
        </div>

        <div className="card">
          <h2>Heutige Geburtstage</h2>
          {bToday.length === 0 ? (
            <p className="muted">Heute niemand im Kalender.</p>
          ) : (
            <ul className="list-tight">
              {bToday.map((b) => (
                <li key={b.id}>
                  <strong>{b.display_name}</strong>
                  <span className="muted small"> · {b.timezone}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/app/birthdays" className="btn ghost small">
            Geburtstage verwalten
          </Link>
        </div>
      </div>
    </div>
  )
}
