import { useEffect, useRef } from 'react'
import { isTauri } from '@tauri-apps/api/core'
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification'
import { supabase } from '../lib/supabase'

export function useTauriReminders(active: boolean) {
  const dedupe = useRef(new Set<string>())

  useEffect(() => {
    if (!active || !isTauri()) return

    const tick = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      let granted = await isPermissionGranted()
      if (!granted) {
        const p = await requestPermission()
        granted = p === 'granted'
      }
      if (!granted) return

      const { data, error } = await supabase.functions.invoke('due-items', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (error || !data) return

      const payload = data as {
        tasks: Array<{ id: string; title: string }>
        birthdays: Array<{ id: string; display_name: string }>
      }

      const dayKey = new Date().toISOString().slice(0, 10)

      for (const t of payload.tasks ?? []) {
        const key = `t-${t.id}`
        if (dedupe.current.has(key)) continue
        dedupe.current.add(key)
        await sendNotification({ title: 'Fällige Aufgabe', body: t.title })
      }
      for (const b of payload.birthdays ?? []) {
        const key = `b-${b.id}-${dayKey}`
        if (dedupe.current.has(key)) continue
        dedupe.current.add(key)
        await sendNotification({
          title: 'Geburtstag',
          body: `${b.display_name} hat heute Geburtstag`,
        })
      }
    }

    void tick()
    const id = window.setInterval(() => void tick(), 120_000)
    return () => clearInterval(id)
  }, [active])
}
