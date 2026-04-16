import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Environment variables
// ---------------------------------------------------------------------------

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] Missing environment variables. ' +
    'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.'
  )
}

// ---------------------------------------------------------------------------
// Exported flags
// ---------------------------------------------------------------------------

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// ---------------------------------------------------------------------------
// Client
//
// Key settings:
//   persistSession   — stores the session token in localStorage so it
//                      survives page refreshes.
//   autoRefreshToken — silently refreshes the access token before it
//                      expires; no manual refresh logic needed.
//   detectSessionInUrl — handles OAuth/magic-link callbacks where the
//                        token arrives in the URL hash/query string.
// ---------------------------------------------------------------------------

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)
