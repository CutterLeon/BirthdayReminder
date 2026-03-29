import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabaseConfigured || !userId) {
      setProfile(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error: e }) => {
        if (cancelled) return
        if (e) setError(e.message)
        else setError(null)
        setProfile(data)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const refresh = async () => {
    if (!userId || !supabaseConfigured) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  return { profile, loading, error, refresh }
}
