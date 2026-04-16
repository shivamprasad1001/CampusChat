
import { useEffect, useState, createContext, useContext, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js'
import { Profile } from '@/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>
  hardReset: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  error: null,
  signOut: async () => {},
  hardReset: () => {},
  refreshProfile: async () => {}
})

const AUTH_TIMEOUT_MS = 8000 // 8 seconds safety timeout

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null
  })
  
  const isInitialized = useRef(false)

  const fetchProfileData = async (userId: string): Promise<Profile | null> => {
    try {
      console.log(`[Auth] Fetching profile for user: ${userId}`)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        if (error.code === '401' || error.message?.includes('JWT')) {
          console.warn('[Auth] Session 401 during profile fetch. Clearing token.')
          signOut()
        } else if (error.code !== 'PGRST116') {
          console.error('[Auth] Profile fetch error:', error)
        }
        return null
      }
      return data as Profile
    } catch (err) {
      console.error('[Auth] Unexpected profile error:', err)
      return null
    }
  }

  const refreshProfile = async () => {
    if (state.user) {
      setState(prev => ({ ...prev, loading: true }))
      const profile = await fetchProfileData(state.user.id)
      setState(prev => ({ ...prev, profile, loading: false }))
    }
  }

  const hardReset = () => {
    console.warn('[Auth] PERFORMING HARD RESET - Clearing all auth storage')
    
    // Wipe all Supabase-related keys from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase.auth.token')) {
        localStorage.removeItem(key)
      }
    })
    
    // Clear state locally
    setState({ user: null, profile: null, loading: false, error: null })
    
    // Redirect to login with a hard reload
    window.location.href = '/login'
  }

  const signOut = async () => {
    console.log('[Auth] Signing out...')
    try {
      await supabase.auth.signOut()
    } finally {
      setState({ user: null, profile: null, loading: false, error: null })
      
      // Clean up specific storage keys
      try {
        const url = import.meta.env.VITE_SUPABASE_URL
        if (url) {
          const storageKey = 'sb-' + new URL(url).hostname + '-auth-token'
          localStorage.removeItem(storageKey)
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    const handleInitialAuth = async () => {
      console.log('[Auth] Initializing authentication...')
      
      // 0. Configuration check
      if (!isSupabaseConfigured) {
        console.error('[Auth] Supabase URL or Anon Key is missing!')
        setState({ 
          user: null, 
          profile: null, 
          loading: false, 
          error: 'Missing Supabase configuration. Please check your environment variables.' 
        })
        isInitialized.current = true
        return
      }

      // 1. Debug Logs (Task 4)
      console.log('[Auth Debug] localStorage keys:', Object.keys(localStorage))

      // 2. Set safety timeout (Task 3)
      timeoutId = setTimeout(() => {
        if (!isInitialized.current) {
          console.warn('[Auth] Initialization timed out. Forcing state reset.')
          setState({
            user: null,
            profile: null,
            loading: false,
            error: null
          })
          isInitialized.current = true
        }
      }, AUTH_TIMEOUT_MS)

      try {
        console.log('[Auth] Restoring session...')
        const { data, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError
        
        let session = data?.session

        // Fallback: force refresh session if null (Task 2)
        if (!session) {
          console.warn('[Auth] No session found via getSession, attempting refresh fallback...')
          const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
          if (!refreshError && refreshed?.session) {
            console.log('[Auth] Session restored via refresh fallback')
            session = refreshed.session
          }
        }

        console.log('[Auth Debug] Final Session:', session)

        if (isInitialized.current) return // Already timed out

        const user = session?.user ?? null
        let profile = null
        
        if (user) {
          console.log(`[Auth] User detected: ${user.email}`)
          profile = await fetchProfileData(user.id)
        } else {
          console.log('[Auth] No active session found')
        }
        
        setState({ user, profile, loading: false, error: null })
        console.log('[Auth] Initialization check complete')
        
      } catch (err) {
        console.error('[Auth] Critical initialization failure:', err)
        setState({ 
          user: null, 
          profile: null, 
          loading: false, 
          error: err instanceof Error ? err.message : 'Authentication failed'
        })
      } finally {
        isInitialized.current = true
        if (timeoutId) clearTimeout(timeoutId)
      }
    }

    handleInitialAuth()

    if (!isSupabaseConfigured) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log(`[Auth Event] ${event}`)
        
        // Task 1: REMOVED the INITIAL_SESSION skip logic.
        // We now process ALL events to ensure we never lose the first valid session update.

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          const user = session?.user ?? null
          const profile = user ? await fetchProfileData(user.id) : null
          setState({ user, profile, loading: false, error: null })
        } else if (event === 'SIGNED_OUT') {
          setState({ user: null, profile: null, loading: false, error: null })
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, signOut, hardReset, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
