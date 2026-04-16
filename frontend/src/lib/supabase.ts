import { createClient } from '@supabase/supabase-js'

type StoredSessionRecord = Record<string, unknown>

interface SafeStorageAdapter {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

const FALLBACK_SUPABASE_URL = 'https://placeholder-url.supabase.co'
const FALLBACK_SUPABASE_KEY = 'placeholder-key'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
}

const resolveAuthStorageKey = (url?: string) => {
  if (!url) {
    return 'sb-auth-token'
  }

  try {
    return `sb-${new URL(url).hostname.split('.')[0]}-auth-token`
  } catch (error) {
    console.warn('[Supabase] Failed to derive auth storage key from URL, using fallback key.', error)
    return 'sb-auth-token'
  }
}

const getBrowserStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch (error) {
    console.warn('[Supabase] localStorage is not available in this browser context.', error)
    return null
  }
}

const safeAuthStorage: SafeStorageAdapter = {
  getItem(key) {
    const storage = getBrowserStorage()

    if (!storage) {
      return null
    }

    try {
      return storage.getItem(key)
    } catch (error) {
      console.warn(`[Supabase] Failed to read auth storage key "${key}".`, error)
      return null
    }
  },

  setItem(key, value) {
    const storage = getBrowserStorage()

    if (!storage) {
      return
    }

    try {
      storage.setItem(key, value)
    } catch (error) {
      console.warn(`[Supabase] Failed to persist auth storage key "${key}".`, error)
    }
  },

  removeItem(key) {
    const storage = getBrowserStorage()

    if (!storage) {
      return
    }

    try {
      storage.removeItem(key)
    } catch (error) {
      console.warn(`[Supabase] Failed to remove auth storage key "${key}".`, error)
    }
  },
}

export const SUPABASE_AUTH_STORAGE_KEY = resolveAuthStorageKey(supabaseUrl)

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const hasBrowserStorage = () => Boolean(getBrowserStorage())

export const readStoredSupabaseSession = (): StoredSessionRecord | null => {
  const rawSession = safeAuthStorage.getItem(SUPABASE_AUTH_STORAGE_KEY)

  if (!rawSession) {
    return null
  }

  try {
    const parsedSession = JSON.parse(rawSession)

    if (parsedSession && typeof parsedSession === 'object') {
      return parsedSession as StoredSessionRecord
    }

    console.warn('[Supabase] Auth storage payload was not an object.')
    return null
  } catch (error) {
    console.warn('[Supabase] Failed to parse persisted auth session payload.', error)
    return null
  }
}

export const clearSupabaseAuthStorage = () => {
  const storage = getBrowserStorage()

  if (!storage) {
    return
  }

  const keysToClear = new Set<string>([
    SUPABASE_AUTH_STORAGE_KEY,
    'supabase.auth.token',
  ])

  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index)

      if (!key) {
        continue
      }

      if (key.startsWith('sb-') || key.includes('supabase.auth.token')) {
        keysToClear.add(key)
      }
    }

    keysToClear.forEach((key) => {
      try {
        storage.removeItem(key)
      } catch (error) {
        console.warn(`[Supabase] Failed to remove persisted auth key "${key}".`, error)
      }
    })
  } catch (error) {
    console.warn('[Supabase] Failed while enumerating auth storage keys.', error)
  }
}

export const supabase = createClient(
  supabaseUrl || FALLBACK_SUPABASE_URL,
  supabaseAnonKey || FALLBACK_SUPABASE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      storage: safeAuthStorage,
      storageKey: SUPABASE_AUTH_STORAGE_KEY,
    },
  }
)
