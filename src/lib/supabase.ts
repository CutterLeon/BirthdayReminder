import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const rawAnon =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  ''

export const supabaseConfigured = Boolean(rawUrl && rawAnon)

/** Ohne .env: gültige Form, damit die App rendert (E2E, lokaler ersten Blick). API-Calls scheitern bis Keys gesetzt sind. */
const url = rawUrl || 'https://placeholder-not-configured.supabase.co'
const anon =
  rawAnon ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.placeholder'

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: supabaseConfigured,
    autoRefreshToken: supabaseConfigured,
  },
})
