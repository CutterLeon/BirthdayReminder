import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { useSession } from '../hooks/useSession'
import { useProfile } from '../hooks/useProfile'
import type { Database } from '../lib/database.types'

type Task = Database['public']['Tables']['tasks']['Row']
type Timebox = Database['public']['Tables']['task_timeboxes']['Row']

function toLocalDateTimeInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

export function DailyPlan() {
  const { user } = useSession()
  const { profile } = useProfile(user?.id)
  const canWrite = profile?.is_active || profile?.role === 'admin'

  const [tasks, setTasks] = useState<Task[]>([])
  const [items, setItems] = useState<Timebox[]>([])
  const [err, setErr] = useState<string | null>(null)

  const now = useMemo(() => new Date(), [])
  const startDefault = useMemo(() => {
    const d = new Date(now)
    d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0)
    return d
  }, [now])
  const endDefault = useMemo(() => {
    const d = new Date(startDefault)
    d.setMinutes(d.getMinutes() + 30)
    return d
  }, [startDefault])

  const [form, setForm] = useState({
    task_id: '',
    title: '',
    start_at: toLocalDateTimeInput(startDefault),
    end_at: toLocalDateTimeInput(endDefault),
    notes: '',
  })

  const load = async () => {
    if (!user?.id) return
    setErr(null)
    const { data: t } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .is('completed_at', null)
      .order('created_at', { ascending: false })
      .limit(200)
    setTasks(t ?? [])

    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const { data: tb, error } = await supabase
      .from('task_timeboxes')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_at', dayStart.toISOString())
      .lt('start_at', dayEnd.toISOString())
      .order('start_at', { ascending: true })

    if (error) setErr(error.message)
    setItems(tb ?? [])
  }

  useEffect(() => {
    void load()
  }, [user?.id])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !canWrite) return
    setErr(null)
    const start = new Date(form.start_at)
    const end = new Date(form.end_at)
    if (!(end > start)) {
      setErr('Ende muss nach Start liegen.')
      return
    }
    const taskId = form.task_id.trim() || null
    const title = form.title.trim() || null
    if (!taskId && !title) {
      setErr('Bitte Task auswählen oder einen Titel eingeben.')
      return
    }
    const { error } = await supabase.from('task_timeboxes').insert({
      user_id: user.id,
      task_id: taskId,
      title,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      notes: form.notes.trim() || null,
    })
    if (error) {
      setErr(error.message)
      return
    }
    setForm({ ...form, title: '', task_id: '', notes: '' })
    await load()
  }

  const remove = async (id: string) => {
    if (!canWrite) return
    await supabase.from('task_timeboxes').delete().eq('id', id)
    await load()
  }

  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks])

  const plannedMinutes = items.reduce((acc, it) => {
    const a = new Date(it.start_at).getTime()
    const b = new Date(it.end_at).getTime()
    return acc + Math.max(0, Math.round((b - a) / 60_000))
  }, 0)

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Daily Plan</h1>
        <p className="muted">Timeboxing für heute — so bleibt der Tag steuerbar.</p>
      </div>

      {!canWrite && (
        <div className="banner subtle">
          Konto nicht freigeschaltet — Daily Plan ist schreibgeschützt bis zur Zahlung.
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h2>Neuer Block</h2>
          <form className="form-grid" onSubmit={add}>
            <label className="span-2">
              Task (optional)
              <select
                value={form.task_id}
                onChange={(e) => setForm({ ...form, task_id: e.target.value })}
                disabled={!canWrite}
              >
                <option value="">—</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                    {t.estimate_minutes != null ? ` (${t.estimate_minutes}m)` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="span-2">
              Titel (wenn kein Task)
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="z. B. Report vorbereiten"
                disabled={!canWrite}
              />
            </label>
            <label>
              Start
              <input
                type="datetime-local"
                value={form.start_at}
                onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                disabled={!canWrite}
              />
            </label>
            <label>
              Ende
              <input
                type="datetime-local"
                value={form.end_at}
                onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                disabled={!canWrite}
              />
            </label>
            <label className="span-2">
              Notizen
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                disabled={!canWrite}
              />
            </label>
            <div className="span-2">
              <button type="submit" className="btn primary" disabled={!canWrite}>
                Hinzufügen
              </button>
            </div>
          </form>
          {err && <p className="error">{err}</p>}
        </div>

        <div className="card">
          <h2>Heute</h2>
          <p className="muted small">
            Geplant: <strong>{plannedMinutes}</strong> Minuten
          </p>
          {items.length === 0 ? (
            <p className="muted">Noch keine Blöcke.</p>
          ) : (
            <ul className="list-tight">
              {items.map((it) => {
                const task = it.task_id ? taskMap.get(it.task_id) : null
                const title = task?.title ?? it.title ?? 'Block'
                return (
                  <li key={it.id} className="row gap align-center">
                    <span className="muted small">
                      {format(new Date(it.start_at), 'HH:mm', { locale: de })}–
                      {format(new Date(it.end_at), 'HH:mm', { locale: de })}
                    </span>
                    <span className="grow">
                      <strong>{title}</strong>
                      {task?.estimate_minutes != null && (
                        <span className="muted small"> · {task.estimate_minutes}m</span>
                      )}
                      {it.notes && <div className="muted small">{it.notes}</div>}
                    </span>
                    <button
                      type="button"
                      className="btn ghost small danger"
                      onClick={() => void remove(it.id)}
                      disabled={!canWrite}
                    >
                      Löschen
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

