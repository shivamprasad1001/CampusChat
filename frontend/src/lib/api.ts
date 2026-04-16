import axios from 'axios'
import { supabase } from './supabase'

/** Remove all Supabase session keys from localStorage. */
function clearSupabaseStorage(): void {
  if (typeof window === 'undefined') return
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sb-')) keysToRemove.push(key)
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key))
  } catch { /* storage may be unavailable */ }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(async (config) => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.warn('[API] Failed to read Supabase session before request.', {
        message: error.message,
      })
    }

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
  } catch (error) {
    console.warn('[API] Unexpected error while attaching auth token.', error)
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('[API] Received 401 Unauthorized. Clearing local auth state.', {
        pathname: typeof window !== 'undefined' ? window.location.pathname : null,
      })

      try {
        await supabase.auth.signOut({ scope: 'local' })
      } catch (signOutError) {
        console.warn('[API] Supabase local signOut failed during 401 handling.', signOutError)
      } finally {
        clearSupabaseStorage()
      }

      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/signup')
      ) {
        window.location.href = '/login?error=session_expired'
      }
    }

    return Promise.reject(error)
  }
)

export default api
