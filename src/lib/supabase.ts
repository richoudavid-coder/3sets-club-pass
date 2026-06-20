import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    "[3SETS Club Pass] Variables d'environnement Supabase manquantes. " +
      'Renseigne VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans ton fichier .env (voir .env.example).'
  )
}

// On fournit des valeurs factices pour éviter un crash au chargement du module
// si les variables d'env ne sont pas encore configurées (mode démo / dev initial).
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)

export const APP_URL: string =
  (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined) || window.location.origin
