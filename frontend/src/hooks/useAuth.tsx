
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
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  error: null,
  signOut: async () => {},
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        if (error.code !== 'PGRST116') {
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

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      setState({ user: null, profile: null, loading: false, error: null })
      
      // Safe cleanup of local storage
      try {
        const url = import.meta.env.VITE_SUPABASE_URL
        if (url) {
          const storageKey = 'sb-' + new URL(url).hostname + '-auth-token'
          localStorage.removeItem(storageKey)
        }
      } catch (e) {
        // Ignore URL parsing errors
      }
    }
  }

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    const handleInitialAuth = async () => {
      // 0. Configuration check
      if (!isSupabaseConfigured) {
        setState({ 
          user: null, 
          profile: null, 
          loading: false, 
          error: 'Missing Supabase configuration. Please check your environment variables.' 
        })
        isInitialized.current = true
        return
      }

      // 1. Set safety timeout
      timeoutId = setTimeout(() => {
        if (!isInitialized.current) {
          console.warn('[Auth] Initialization timed out after 8s. Forcing loading screen to clear.')
          setState(prev => ({ ...prev, loading: false }))
          isInitialized.current = true
        }
      }, AUTH_TIMEOUT_MS)

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (isInitialized.current) return // Already timed out

        const user = session?.user ?? null
        let profile = null
        if (user) {
          profile = await fetchProfileData(user.id)
        }
        
        setState({ user, profile, loading: false, error: null })
        isInitialized.current = true
        if (timeoutId) clearTimeout(timeoutId)
      } catch (err) {
        console.error('[Auth] Initial check failed:', err)
        setState({ 
          user: null, 
          profile: null, 
          loading: false, 
          error: err instanceof Error ? err.message : 'Authentication failed to initialize'
        })
        isInitialized.current = true
        if (timeoutId) clearTimeout(timeoutId)
      }
    }

    handleInitialAuth()

    if (!isSupabaseConfigured) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!isInitialized.current && event === 'INITIAL_SESSION') return

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
    <AuthContext.Provider value={{ ...state, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
