
import { useEffect, useState, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js'
import { Profile } from '@/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {}
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true
  })

  const fetchProfileData = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is 'no rows returned'
          console.error('[Auth] Error fetching profile:', error)
        }
        return null
      }
      return data as Profile
    } catch (err) {
      console.error('[Auth] Unexpected error:', err)
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

  useEffect(() => {
    // 1. Initial manual check to avoid race conditions on mount
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user ?? null
        let profile = null
        
        if (user) {
          profile = await fetchProfileData(user.id)
        }
        
        setState({ user, profile, loading: false })
      } catch (err) {
        console.error('[Auth] Initialization error:', err)
        setState(prev => ({ ...prev, loading: false }))
      }
    }

    initAuth()

    // 2. Listener for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        // We only trigger re-fetches on specific events to avoid redundant renders
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          const user = session?.user ?? null
          const profile = user ? await fetchProfileData(user.id) : null
          setState({ user, profile, loading: false })
        } else if (event === 'SIGNED_OUT') {
          setState({ user: null, profile: null, loading: false })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setState({ user: null, profile: null, loading: false })
  }

  return (
    <AuthContext.Provider value={{ ...state, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
