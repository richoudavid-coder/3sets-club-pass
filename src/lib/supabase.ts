import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn(
    "[3SETS Club Pass] Variables d environnement Supabase manquantes. " +
      "Renseigne VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY."
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)

function resolveAppUrl(): string {
  const raw = (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined)
  const trimmed = raw ? raw.trim() : ''

  if (trimmed) {
    try {
      return new URL(trimmed).origin
    } catch (e) {
      // valeur invalide, on retombe sur window.location.origin ci-dessous
    }
  }

  return window.location.origin
}

export const APP_URL: string = resolveAppUrl()
