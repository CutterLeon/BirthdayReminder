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
type Timebox = Database['public']['Tables']['task_timeboxes']['Row']
type MonitorLink = Database['public']['Tables']['monitor_links']['Row']
type MonitorCheck = Database['public']['Tables']['monitor_checks']['Row']

export function Dashboard() {
  const { user } = useSession()
  const { profile, refresh } = useProfile(user?.id)
  const [tasks, setTasks] = useState<Task[]>([])
  const [birthdays, setBirthdays] = useState<Birthday[]>([])
  const [timeboxes, setTimeboxes] = useState<Timebox[]>([])
  const [monitorLinks, setMonitorLinks] = useState<MonitorLink[]>([])
  const [monitorChecks, setMonitorChecks] = useState<Map<string, MonitorCheck>>(
    new Map(),
  )
  const [tz, setTz] = useState(profile?.default_timezone ?? 'Europe/Berlin')

  useEffect(() => {
    if (profile?.default_timezone) setTz(profile.default_timezone)
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

      const dayStart = new Date()
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)
      const { data: tb } = await supabase
        .from('task_timeboxes')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_at', dayStart.toISOString())
        .lt('start_at', dayEnd.toISOString())
        .order('start_at', { ascending: true })
      setTimeboxes(tb ?? [])

      const { data: ml } = await supabase
        .from('monitor_links')
        .select('*')
        .eq('user_id', user.id)
        .eq('enabled', true)
        .order('created_at', { ascending: false })
      setMonitorLinks(ml ?? [])

      const ids = (ml ?? []).map((l) => l.id)
      if (ids.length > 0) {
        const { data: c } = await supabase
          .from('monitor_checks')
          .select('*')
          .in('monitor_link_id', ids)
          .order('checked_at', { ascending: false })
          .limit(200)
        const map = new Map<string, MonitorCheck>()
        for (const row of c ?? []) {
          if (!map.has(row.monitor_link_id)) map.set(row.monitor_link_id, row)
        }
        setMonitorChecks(map)
      } else {
        setMonitorChecks(new Map())
      }
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
  const plannedMinutes = timeboxes.reduce((acc, it) => {
    const a = new Date(it.start_at).getTime()
    const b = new Date(it.end_at).getTime()
    return acc + Math.max(0, Math.round((b - a) / 60_000))
  }, 0)
  const estOpenMinutes = openTasks.reduce(
    (acc, t) => acc + (t.estimate_minutes ?? 0),
    0,
  )

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
    await supabase.from('profiles').update({ default_timezone: tz }).eq('id', user.id)
    await refresh()
  }

  const canUse = profile?.is_active || profile?.role === 'admin'

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="muted">
          Wichtiges zuerst — Fortschritt und heutige Geburtstage.
        </p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Fortschritt</h2>
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
              Nach Freischaltung kannst du Aufgaben anlegen.{' '}
              <Link to="/pricing">Zur Zahlung</Link>
            </p>
          )}
        </div>

        <div className="card">
          <h2>Deine Zeitzone</h2>
          <p className="muted small">
            Für spätere Erweiterungen (z. B. Tages-Mails). Geburtstags-Mails nutzen die Zeitzone pro
            Kontakt.
          </p>
          <div className="row">
            <select value={tz} onChange={(e) => setTz(e.target.value)} className="grow">
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

      <div className="grid-2">
        <div className="card">
          <h2>Daily Plan (heute)</h2>
          <p className="muted small">
            Geplant: <strong>{plannedMinutes}</strong> Minuten · Offene Task-Schätzung:{' '}
            <strong>{estOpenMinutes}</strong> Minuten
          </p>
          {timeboxes.length === 0 ? (
            <p className="muted">Noch keine Blöcke geplant.</p>
          ) : (
            <ul className="list-tight">
              {timeboxes.slice(0, 6).map((tb) => (
                <li key={tb.id} className="muted small">
                  <strong>
                    {format(new Date(tb.start_at), 'HH:mm', { locale: de })}–
                    {format(new Date(tb.end_at), 'HH:mm', { locale: de })}
                  </strong>{' '}
                  · {tb.title ?? 'Block'}
                </li>
              ))}
            </ul>
          )}
          <Link to="/app/plan" className="btn ghost small">
            Daily Plan öffnen
          </Link>
        </div>

        <div className="card">
          <h2>Heartbeat Links</h2>
          {monitorLinks.length === 0 ? (
            <p className="muted">Keine Links angelegt.</p>
          ) : (
            <ul className="list-tight">
              {monitorLinks.slice(0, 8).map((l) => {
                const c = monitorChecks.get(l.id)
                const ok = c?.ok ?? false
                const status = c?.status_code ?? null
                const cls = ok ? 'badge ok' : 'badge warn'
                return (
                  <li key={l.id} className="row gap align-center">
                    <span className={cls}>{status ?? '—'}</span>
                    <a href={l.url} target="_blank" rel="noreferrer" className="grow">
                      {l.name}
                    </a>
                    {c?.latency_ms != null && (
                      <span className="muted small">{c.latency_ms}ms</span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          <Link to="/app/settings" className="btn ghost small">
            Links verwalten
          </Link>
        </div>
      </div>
    </div>
  )
}
