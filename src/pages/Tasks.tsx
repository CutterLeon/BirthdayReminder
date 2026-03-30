import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { useSession } from '../hooks/useSession'
import { useProfile } from '../hooks/useProfile'
import type { Database } from '../lib/database.types'

type Task = Database['public']['Tables']['tasks']['Row']
type Priority = 'low' | 'medium' | 'high'

const emptyForm = {
  title: '',
  description: '',
  priority: 'medium' as Priority,
  due_at: '',
  estimate_minutes: '',
}

export function Tasks() {
  const { user } = useSession()
  const { profile } = useProfile(user?.id)
  const [tasks, setTasks] = useState<Task[]>([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const canWrite = profile?.is_active || profile?.role === 'admin'

  const load = async () => {
    if (!user?.id) return
    const { data, error: e } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (e) setError(e.message)
    else setError(null)
    setTasks(data ?? [])
  }

  useEffect(() => {
    void load()
  }, [user?.id])

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !canWrite) return
    setError(null)
    const due = form.due_at ? new Date(form.due_at).toISOString() : null
    const estimate =
      form.estimate_minutes.trim() === '' ? null : Number(form.estimate_minutes)
    if (estimate !== null && (!Number.isFinite(estimate) || estimate < 0)) {
      setError('Schätzung muss eine Zahl ≥ 0 sein.')
      return
    }
    const { error: e2 } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      due_at: due,
      estimate_minutes: estimate,
    })
    if (e2) {
      setError(e2.message)
      return
    }
    setForm(emptyForm)
    await load()
  }

  const toggleDone = async (t: Task) => {
    if (!canWrite) return
    const completed = t.completed_at ? null : new Date().toISOString()
    await supabase.from('tasks').update({ completed_at: completed }).eq('id', t.id)
    await load()
  }

  const remove = async (id: string) => {
    if (!canWrite) return
    await supabase.from('tasks').delete().eq('id', id)
    await load()
  }

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Aufgaben</h1>
        <p className="muted">Priorität, Fälligkeit, erledigt oder offen.</p>
      </div>

      {!canWrite && (
        <div className="banner subtle">
          Konto nicht freigeschaltet — Aufgaben sind schreibgeschützt bis zur Zahlung.
        </div>
      )}

      <div className="card">
        <h2>Neue Aufgabe</h2>
        <form className="form-grid" onSubmit={addTask}>
          <label className="span-2">
            Titel
            <input
              value={form.title}
              onChange={(ev) => setForm({ ...form, title: ev.target.value })}
              required
              disabled={!canWrite}
            />
          </label>
          <label className="span-2">
            Beschreibung
            <textarea
              value={form.description}
              onChange={(ev) => setForm({ ...form, description: ev.target.value })}
              rows={2}
              disabled={!canWrite}
            />
          </label>
          <label>
            Priorität
            <select
              value={form.priority}
              onChange={(ev) =>
                setForm({ ...form, priority: ev.target.value as Priority })
              }
              disabled={!canWrite}
            >
              <option value="low">Niedrig</option>
              <option value="medium">Mittel</option>
              <option value="high">Hoch</option>
            </select>
          </label>
          <label>
            Fällig
            <input
              type="datetime-local"
              value={form.due_at}
              onChange={(ev) => setForm({ ...form, due_at: ev.target.value })}
              disabled={!canWrite}
            />
          </label>
          <label>
            Schätzung (Min)
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={form.estimate_minutes}
              onChange={(ev) =>
                setForm({ ...form, estimate_minutes: ev.target.value })
              }
              placeholder="z. B. 30"
              disabled={!canWrite}
            />
          </label>
          <div className="span-2">
            <button type="submit" className="btn primary" disabled={!canWrite}>
              Hinzufügen
            </button>
          </div>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        <h2>Liste</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Titel</th>
                <th>Prio</th>
                <th>Fällig</th>
                <th>Schätzung</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className={t.completed_at ? 'done' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={Boolean(t.completed_at)}
                      onChange={() => void toggleDone(t)}
                      disabled={!canWrite}
                    />
                  </td>
                  <td>
                    <strong>{t.title}</strong>
                    {t.description && (
                      <div className="muted small">{t.description}</div>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${t.priority}`}>{t.priority}</span>
                  </td>
                  <td className="muted small">
                    {t.due_at
                      ? format(new Date(t.due_at), 'dd.MM.yyyy HH:mm', { locale: de })
                      : '—'}
                  </td>
                  <td className="muted small">
                    {t.estimate_minutes != null ? `${t.estimate_minutes} min` : '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn ghost small danger"
                      onClick={() => void remove(t.id)}
                      disabled={!canWrite}
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && <p className="muted">Noch keine Aufgaben.</p>}
        </div>
      </div>
    </div>
  )
}
