import { useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { useSession } from '../hooks/useSession'
import { useProfile } from '../hooks/useProfile'
import type { Database } from '../lib/database.types'

type CalendarFeed = Database['public']['Tables']['calendar_feeds']['Row']
type MonitorLink = Database['public']['Tables']['monitor_links']['Row']
type MonitorCheck = Database['public']['Tables']['monitor_checks']['Row']

function base64Url(bytes: Uint8Array) {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  const b64 = btoa(bin)
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function generateToken() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return base64Url(bytes)
}

function functionsBaseUrl(supabaseUrl: string) {
  try {
    const u = new URL(supabaseUrl)
    // https://xyz.supabase.co -> https://xyz.functions.supabase.co
    u.hostname = u.hostname.replace(/\.supabase\.co$/, '.functions.supabase.co')
    return u.origin
  } catch {
    return ''
  }
}

export function Settings() {
  const { user } = useSession()
  const { profile } = useProfile(user?.id)
  const canWrite = profile?.is_active || profile?.role === "admin"

  const [feed, setFeed] = useState<CalendarFeed | null>(null)
  const [feedBusy, setFeedBusy] = useState(false)
  const [feedErr, setFeedErr] = useState<string | null>(null)
  const [feedMsg, setFeedMsg] = useState<string | null>(null)

  const [links, setLinks] = useState<MonitorLink[]>([])
  const [checks, setChecks] = useState<Map<string, MonitorCheck>>(new Map())
  const [linksErr, setLinksErr] = useState<string | null>(null)
  const [linkForm, setLinkForm] = useState({
    name: '',
    url: '',
    enabled: true,
    check_interval_minutes: '10',
  })

  const icsUrl = useMemo(() => {
    if (!feed?.token) return ''
    const base = functionsBaseUrl(import.meta.env.VITE_SUPABASE_URL ?? '')
    if (!base) return ''
    const u = new URL('/calendar-ics', base)
    u.searchParams.set('token', feed.token)
    return u.toString()
  }, [feed?.token])

  const loadFeed = async () => {
    if (!user?.id) return
    setFeedErr(null)
    const { data, error } = await supabase
      .from('calendar_feeds')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) {
      setFeedErr(error.message)
      return
    }
    if (data) {
      setFeed(data)
      return
    }
    // create first feed row (token generated client-side, protected by RLS)
    if (!canWrite) return
    const token = generateToken()
    const { data: created, error: e2 } = await supabase
      .from('calendar_feeds')
      .insert({
        user_id: user.id,
        token,
        enabled: true,
        include_birthdays: true,
        include_tasks: true,
        include_timeboxes: true,
      })
      .select('*')
      .single()
    if (e2) setFeedErr(e2.message)
    else setFeed(created)
  }

  const saveFeed = async (patch: Partial<CalendarFeed>) => {
    if (!user?.id || !feed || !canWrite) return
    setFeedBusy(true)
    setFeedErr(null)
    setFeedMsg(null)
    const { data, error } = await supabase
      .from('calendar_feeds')
      .update(patch)
      .eq('user_id', user.id)
      .select('*')
      .single()
    setFeedBusy(false)
    if (error) setFeedErr(error.message)
    else {
      setFeed(data)
      setFeedMsg('Gespeichert.')
      setTimeout(() => setFeedMsg(null), 2000)
    }
  }

  const resetToken = async () => {
    if (!feed) return
    await saveFeed({ token: generateToken() })
  }

  const copyIcs = async () => {
    if (!icsUrl) return
    await navigator.clipboard.writeText(icsUrl)
    setFeedMsg('ICS-Link kopiert.')
    setTimeout(() => setFeedMsg(null), 2000)
  }

  const loadLinks = async () => {
    if (!user?.id) return
    setLinksErr(null)
    const { data, error } = await supabase
      .from('monitor_links')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) {
      setLinksErr(error.message)
      return
    }
    setLinks(data ?? [])

    const ids = (data ?? []).map((l) => l.id)
    if (ids.length === 0) {
      setChecks(new Map())
      return
    }
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
    setChecks(map)
  }

  useEffect(() => {
    if (!user?.id) return
    void loadFeed()
    void loadLinks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, canWrite])

  const addLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !canWrite) return
    setLinksErr(null)
    const interval = Number(linkForm.check_interval_minutes)
    if (!Number.isFinite(interval) || interval < 1) {
      setLinksErr('Intervall muss eine Zahl ≥ 1 sein.')
      return
    }
    const { error } = await supabase.from('monitor_links').insert({
      user_id: user.id,
      name: linkForm.name.trim(),
      url: linkForm.url.trim(),
      enabled: linkForm.enabled,
      check_interval_minutes: interval,
    })
    if (error) {
      setLinksErr(error.message)
      return
    }
    setLinkForm({ name: '', url: '', enabled: true, check_interval_minutes: '10' })
    await loadLinks()
  }

  const toggleLink = async (l: MonitorLink) => {
    if (!canWrite) return
    await supabase
      .from('monitor_links')
      .update({ enabled: !l.enabled })
      .eq('id', l.id)
    await loadLinks()
  }

  const removeLink = async (id: string) => {
    if (!canWrite) return
    await supabase.from('monitor_links').delete().eq('id', id)
    await loadLinks()
  }

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Einstellungen</h1>
        <p className="muted">
          Kalender-Feed (Outlook) und Website-Heartbeat-Shortcuts.
        </p>
      </div>

      {!supabaseConfigured && (
        <div className="banner subtle">
          Supabase ist nicht konfiguriert (fehlende <code>VITE_SUPABASE_*</code> Variablen). Viele
          Features sind im Demo-Modus.
        </div>
      )}

      {!canWrite && (
        <div className="banner subtle">
          Konto nicht freigeschaltet — Einstellungen sind schreibgeschützt bis zur Zahlung.
        </div>
      )}

      <div className="card">
        <h2>Outlook Kalender (ICS)</h2>
        <p className="muted small">
          Abonnierbarer ICS-Feed (Geburtstage, Tasks mit Fälligkeit, Daily Plan). Outlook aktualisiert
          nicht sofort — das ist normal.
        </p>

        {feedErr && <p className="error">{feedErr}</p>}
        {feedMsg && <p className="ok">{feedMsg}</p>}

        {feed ? (
          <div className="stack">
            <div className="row gap align-center">
              <input value={icsUrl || '—'} readOnly className="grow" />
              <button
                type="button"
                className="btn secondary"
                onClick={() => void copyIcs()}
                disabled={!icsUrl}
              >
                Link kopieren
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => void resetToken()}
                disabled={!canWrite || feedBusy}
              >
                Token zurücksetzen
              </button>
            </div>

            <div className="row wrap gap">
              <label className="row gap align-center">
                <input
                  type="checkbox"
                  checked={feed.enabled}
                  disabled={!canWrite || feedBusy}
                  onChange={(e) => void saveFeed({ enabled: e.target.checked })}
                />
                Feed aktiv
              </label>
              <label className="row gap align-center">
                <input
                  type="checkbox"
                  checked={feed.include_birthdays}
                  disabled={!canWrite || !feed.enabled || feedBusy}
                  onChange={(e) =>
                    void saveFeed({ include_birthdays: e.target.checked })
                  }
                />
                Geburtstage
              </label>
              <label className="row gap align-center">
                <input
                  type="checkbox"
                  checked={feed.include_tasks}
                  disabled={!canWrite || !feed.enabled || feedBusy}
                  onChange={(e) => void saveFeed({ include_tasks: e.target.checked })}
                />
                Tasks
              </label>
              <label className="row gap align-center">
                <input
                  type="checkbox"
                  checked={feed.include_timeboxes}
                  disabled={!canWrite || !feed.enabled || feedBusy}
                  onChange={(e) =>
                    void saveFeed({ include_timeboxes: e.target.checked })
                  }
                />
                Daily Plan
              </label>
            </div>
          </div>
        ) : (
          <p className="muted">Lade…</p>
        )}
      </div>

      <div className="card">
        <h2>Heartbeat Links</h2>
        <p className="muted small">
          Lege Links an (Shortcuts) und lass sie serverseitig prüfen. Im Dashboard siehst du zuletzt
          bekannte Status-Codes.
        </p>

        <form className="form-grid" onSubmit={addLink}>
          <label className="span-2">
            Name
            <input
              value={linkForm.name}
              onChange={(e) => setLinkForm({ ...linkForm, name: e.target.value })}
              required
              disabled={!canWrite}
            />
          </label>
          <label className="span-2">
            URL
            <input
              value={linkForm.url}
              onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
              placeholder="https://example.com"
              required
              disabled={!canWrite}
            />
          </label>
          <label>
            Intervall (Min)
            <input
              type="number"
              min={1}
              value={linkForm.check_interval_minutes}
              onChange={(e) =>
                setLinkForm({ ...linkForm, check_interval_minutes: e.target.value })
              }
              disabled={!canWrite}
            />
          </label>
          <label className="row gap align-center">
            <input
              type="checkbox"
              checked={linkForm.enabled}
              onChange={(e) => setLinkForm({ ...linkForm, enabled: e.target.checked })}
              disabled={!canWrite}
            />
            Aktiv
          </label>
          <div className="span-2">
            <button type="submit" className="btn primary" disabled={!canWrite}>
              Hinzufügen
            </button>
            <button type="button" className="btn ghost" onClick={() => void loadLinks()}>
              Aktualisieren
            </button>
          </div>
        </form>

        {linksErr && <p className="error">{linksErr}</p>}

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Name</th>
                <th>URL</th>
                <th>Letzte Prüfung</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {links.map((l) => {
                const c = checks.get(l.id)
                const ok = c?.ok ?? false
                const status = c?.status_code ?? null
                const dot = ok ? 'badge ok' : 'badge warn'
                return (
                  <tr key={l.id} className={!l.enabled ? 'muted' : ''}>
                    <td>
                      <span className={dot}>{status ?? (l.enabled ? '—' : 'off')}</span>
                    </td>
                    <td>
                      <strong>{l.name}</strong>
                      {!l.enabled && <div className="muted small">deaktiviert</div>}
                    </td>
                    <td className="muted small">
                      <a href={l.url} target="_blank" rel="noreferrer">
                        {l.url}
                      </a>
                    </td>
                    <td className="muted small">
                      {c?.checked_at ? new Date(c.checked_at).toLocaleString() : '—'}
                      {c?.latency_ms != null && (
                        <span className="muted small"> · {c.latency_ms}ms</span>
                      )}
                    </td>
                    <td className="row gap">
                      <button
                        type="button"
                        className="btn secondary small"
                        onClick={() => void toggleLink(l)}
                        disabled={!canWrite}
                      >
                        {l.enabled ? 'Deaktivieren' : 'Aktivieren'}
                      </button>
                      <button
                        type="button"
                        className="btn ghost small danger"
                        onClick={() => void removeLink(l.id)}
                        disabled={!canWrite}
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {links.length === 0 && <p className="muted">Noch keine Links.</p>}
        </div>
      </div>
    </div>
  )
}

