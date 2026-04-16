import { useEffect, useState, useRef, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import { Session, User } from '@supabase/supabase-js'
import { Profile } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthState {
  user: User | null
  profile: Profile | null
  /** True only during the initial session resolution on mount. */
  loading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  /**
   * Clears every Supabase key from localStorage and reloads the page.
   * Use this as a last-resort recovery when the session is corrupt.
   */
  hardReset: () => void
}

const PROFILE_FETCH_TIMEOUT_MS = 7000
const AUTH_HARD_TIMEOUT_MS = 12000

// ---------------------------------------------------------------------------
// Context (safe default — loading is true until the listener fires)
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  error: null,
  signOut: async () => {},
  refreshProfile: async () => {},
  hardReset: () => {},
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[Auth] Profile fetch error:', error.message)
      return null
    }

    return data as Profile
  } catch (err) {
    console.error('[Auth] Unexpected profile error:', err)
    return null
  }
}

/**
 * Removes all Supabase-related keys from localStorage without touching
 * anything else. Supabase keys always start with "sb-".
 */
function clearSupabaseStorage(): void {
  if (typeof window === 'undefined') return

  try {
    const keysToRemove: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sb-')) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key))
  } catch {
    // localStorage may be unavailable in some private-browsing environments.
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => resolve(fallback), timeoutMs)
  })

  const result = await Promise.race([promise, timeoutPromise])
  if (timeoutId) clearTimeout(timeoutId)
  return result
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  })

  /**
   * Prevent state updates after the component has unmounted (e.g. during
   * hot-module replacement or strict-mode double-effects in development).
   */
  const mountedRef = useRef(true)
  const initResolvedRef = useRef(false)

  // -------------------------------------------------------------------------
  // signOut
  // -------------------------------------------------------------------------

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('[Auth] signOut error:', err)
    }
    // onAuthStateChange will fire SIGNED_OUT and update state for us.
    // We don't need to manually setState here — keeping state in sync with
    // the single source of truth.
  }

  // -------------------------------------------------------------------------
  // refreshProfile
  // -------------------------------------------------------------------------

  const refreshProfile = async () => {
    if (!mountedRef.current) return

    const currentUser = state.user
    if (!currentUser) return

    const profile = await fetchProfile(currentUser.id)

    if (mountedRef.current) {
      setState((prev) => ({ ...prev, profile }))
    }
  }

  // -------------------------------------------------------------------------
  // hardReset
  // -------------------------------------------------------------------------

  const hardReset = () => {
    clearSupabaseStorage()
    window.location.reload()
  }

  // -------------------------------------------------------------------------
  // Auth listener — single source of truth
  //
  // onAuthStateChange fires synchronously with event = 'INITIAL_SESSION'
  // on subscriber registration when a persisted session exists, or with
  // session = null when there is no session.  No separate getSession() call
  // is needed and doing so creates a race condition.
  // -------------------------------------------------------------------------

  useEffect(() => {
    mountedRef.current = true
    initResolvedRef.current = false

    const applySession = async (session: Session | null) => {
      if (!mountedRef.current) return

      const user = session?.user ?? null

      if (!user) {
        initResolvedRef.current = true
        setState({
          user: null,
          profile: null,
          loading: false,
          error: null,
        })
        return
      }

      const profile = await withTimeout(
        fetchProfile(user.id),
        PROFILE_FETCH_TIMEOUT_MS,
        null
      )

      if (!mountedRef.current) return

      initResolvedRef.current = true
      setState({
        user,
        profile,
        loading: false,
        error: null,
      })
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mountedRef.current) return
      await applySession(session)
    })

    // Fallback for edge cases where INITIAL_SESSION does not resolve promptly
    // on certain environments/domains and the app appears stuck on loading.
    const fallbackTimer = window.setTimeout(async () => {
      if (!mountedRef.current || initResolvedRef.current) return

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mountedRef.current || initResolvedRef.current) return
        await applySession(session)
      } catch (err) {
        if (!mountedRef.current || initResolvedRef.current) return

        console.error('[Auth] Fallback session resolution failed:', err)
        initResolvedRef.current = true
        setState({
          user: null,
          profile: null,
          loading: false,
          error: null,
        })
      }
    }, 4000)

    // Absolute safety net: never keep the app in auth loading forever.
    const hardTimeout = window.setTimeout(async () => {
      if (!mountedRef.current || initResolvedRef.current) return

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mountedRef.current || initResolvedRef.current) return

        initResolvedRef.current = true
        setState({
          user: session?.user ?? null,
          profile: null,
          loading: false,
          error: null,
        })
      } catch {
        if (!mountedRef.current || initResolvedRef.current) return
        initResolvedRef.current = true
        setState({
          user: null,
          profile: null,
          loading: false,
          error: null,
        })
      }
    }, AUTH_HARD_TIMEOUT_MS)

    return () => {
      mountedRef.current = false
      window.clearTimeout(fallbackTimer)
      window.clearTimeout(hardTimeout)
      subscription.unsubscribe()
    }
  }, [])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signOut,
        refreshProfile,
        hardReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)