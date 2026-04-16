import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { type AuthChangeEvent, type Session, type User } from '@supabase/supabase-js'
import {
  clearSupabaseAuthStorage,
  hasBrowserStorage,
  isSupabaseConfigured,
  readStoredSupabaseSession,
  supabase,
} from '@/lib/supabase'
import type { Profile } from '@/types'

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

type SessionSource = 'event' | 'getSession' | 'refreshSession' | 'getUser' | 'none'

interface SessionRecoveryResult {
  session: Session | null
  source: SessionSource
  failures: string[]
}

interface ProfileFetchResult {
  profile: Profile | null
  shouldForceLogout: boolean
  failureReason: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  error: null,
  signOut: async () => {},
  hardReset: () => {},
  refreshProfile: async () => {},
})

const AUTH_TIMEOUT_MS = 10000
const STORAGE_WAIT_MS = 1200
const STORAGE_POLL_MS = 150
const AUTH_EVENTS_TO_SYNC = new Set<AuthChangeEvent>([
  'SIGNED_IN',
  'TOKEN_REFRESHED',
  'USER_UPDATED',
  'PASSWORD_RECOVERY',
])

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const formatError = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'Unknown authentication error'
}

const looksLikeAuthFailure = (message: string | null | undefined) =>
  Boolean(message && /(401|jwt|invalid token|invalid jwt|auth session missing|unauthorized|refresh token)/i.test(message))

const isValidSession = (session: Session | null | undefined): session is Session =>
  Boolean(session?.access_token && session?.user?.id)

const extractPersistedToken = (
  sessionRecord: Record<string, unknown> | null,
  tokenKey: 'access_token' | 'refresh_token'
) => {
  if (!sessionRecord) {
    return null
  }

  const directValue = sessionRecord[tokenKey]

  if (typeof directValue === 'string' && directValue.length > 0) {
    return directValue
  }

  const nestedKeys = ['session', 'currentSession']

  for (const nestedKey of nestedKeys) {
    const nestedValue = sessionRecord[nestedKey]

    if (!nestedValue || typeof nestedValue !== 'object') {
      continue
    }

    const tokenValue = (nestedValue as Record<string, unknown>)[tokenKey]

    if (typeof tokenValue === 'string' && tokenValue.length > 0) {
      return tokenValue
    }
  }

  return null
}

const waitForBrowserStorage = async () => {
  if (hasBrowserStorage()) {
    return true
  }

  if (typeof window === 'undefined') {
    return false
  }

  const attempts = Math.ceil(STORAGE_WAIT_MS / STORAGE_POLL_MS)

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await wait(STORAGE_POLL_MS)

    if (hasBrowserStorage()) {
      return true
    }
  }

  return false
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  })

  const mountedRef = useRef(false)
  const stateRef = useRef(state)
  const authRunIdRef = useRef(0)
  const initStartedRef = useRef(false)
  const initResolvedRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setStateSafely = (nextState: AuthState) => {
    if (!mountedRef.current) {
      return
    }

    stateRef.current = nextState
    setState(nextState)
  }

  const clearAuthTimeout = () => {
    if (!timeoutRef.current) {
      return
    }

    clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }

  const resolveAuthState = (
    nextState: Omit<AuthState, 'loading'>,
    context: string,
    runId?: number
  ) => {
    if (typeof runId === 'number' && runId !== authRunIdRef.current) {
      console.info('[Auth] Ignoring stale auth result.', { context, runId, currentRunId: authRunIdRef.current })
      return
    }

    initResolvedRef.current = true
    clearAuthTimeout()

    const resolvedState: AuthState = {
      user: nextState.user,
      profile: nextState.profile,
      error: nextState.error,
      loading: false,
    }

    setStateSafely(resolvedState)

    console.info('[Auth] Final auth state:', {
      context,
      userId: resolvedState.user?.id ?? null,
      hasProfile: Boolean(resolvedState.profile),
      loading: resolvedState.loading,
      error: resolvedState.error,
    })
  }

  const invalidateAuthRuns = (reason: string) => {
    authRunIdRef.current += 1
    clearAuthTimeout()

    console.info('[Auth] Invalidated in-flight auth work.', {
      reason,
      nextRunId: authRunIdRef.current,
    })
  }

  const applyLoggedOutState = (reason: string, options?: { clearStorage?: boolean }) => {
    invalidateAuthRuns(reason)

    if (options?.clearStorage !== false) {
      clearSupabaseAuthStorage()
    }

    resolveAuthState(
      {
        user: null,
        profile: null,
        error: null,
      },
      `logged-out:${reason}`
    )
  }

  const armInitializationTimeout = (runId: number) => {
    clearAuthTimeout()

    timeoutRef.current = setTimeout(() => {
      if (!mountedRef.current || initResolvedRef.current || runId !== authRunIdRef.current) {
        return
      }

      console.error('[Auth] Initialization timed out. Resetting to a logged-out state.')
      applyLoggedOutState('initialization-timeout')
    }, AUTH_TIMEOUT_MS)
  }

  const performClientSignOut = async (reason: string) => {
    console.warn('[Auth] Performing local sign out.', { reason })
    invalidateAuthRuns(`sign-out:${reason}`)

    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' })

      if (error) {
        console.warn('[Auth] Supabase signOut returned an error.', { reason, message: error.message })
      }
    } catch (error) {
      console.error('[Auth] Supabase signOut threw an unexpected error.', { reason, error })
    }

    clearSupabaseAuthStorage()

    resolveAuthState(
      {
        user: null,
        profile: null,
        error: null,
      },
      `sign-out:${reason}`
    )
  }

  const fetchProfileData = async (userId: string): Promise<ProfileFetchResult> => {
    try {
      console.info('[Auth] Fetching profile.', { userId })

      const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        const failureReason = error.message || 'Profile fetch failed'
        const shouldForceLogout = status === 401 || looksLikeAuthFailure(failureReason)

        if (shouldForceLogout) {
          console.warn('[Auth] Profile fetch failed with an auth error.', {
            userId,
            status,
            failureReason,
          })
        } else {
          console.error('[Auth] Profile fetch failed.', {
            userId,
            status,
            code: error.code,
            failureReason,
          })
        }

        return {
          profile: null,
          shouldForceLogout,
          failureReason,
        }
      }

      return {
        profile: (data as Profile | null) ?? null,
        shouldForceLogout: false,
        failureReason: null,
      }
    } catch (error) {
      const failureReason = formatError(error)
      const shouldForceLogout = looksLikeAuthFailure(failureReason)

      console.error('[Auth] Unexpected profile fetch failure.', {
        userId,
        failureReason,
      })

      return {
        profile: null,
        shouldForceLogout,
        failureReason,
      }
    }
  }

  const recoverSession = async (): Promise<SessionRecoveryResult> => {
    const failures: string[] = []
    const storageReady = await waitForBrowserStorage()
    const storedSession = readStoredSupabaseSession()
    const hasAccessToken = Boolean(extractPersistedToken(storedSession, 'access_token'))
    const hasRefreshToken = Boolean(extractPersistedToken(storedSession, 'refresh_token'))

    console.info('[Auth] Starting session recovery.', {
      storageReady,
      hasPersistedSession: Boolean(storedSession),
      hasAccessToken,
      hasRefreshToken,
    })

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        const failureReason = `getSession: ${error.message}`
        failures.push(failureReason)
        console.warn('[Auth] getSession failed.', { failureReason })
      } else if (isValidSession(session)) {
        console.info('[Auth] Session recovered from getSession.')
        return { session, source: 'getSession', failures }
      } else {
        console.info('[Auth] getSession returned no active session.')
      }
    } catch (error) {
      const failureReason = `getSession: ${formatError(error)}`
      failures.push(failureReason)
      console.error('[Auth] getSession threw unexpectedly.', { failureReason })
    }

    if (hasRefreshToken) {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.refreshSession()

        if (error) {
          const failureReason = `refreshSession: ${error.message}`
          failures.push(failureReason)
          console.warn('[Auth] refreshSession failed.', { failureReason })
        } else if (isValidSession(session)) {
          console.info('[Auth] Session recovered from refreshSession.')
          return { session, source: 'refreshSession', failures }
        } else {
          console.info('[Auth] refreshSession returned no active session.')
        }
      } catch (error) {
        const failureReason = `refreshSession: ${formatError(error)}`
        failures.push(failureReason)
        console.error('[Auth] refreshSession threw unexpectedly.', { failureReason })
      }
    } else {
      const failureReason = storageReady
        ? 'refreshSession skipped: refresh token missing'
        : 'refreshSession skipped: browser storage unavailable'

      failures.push(failureReason)
      console.warn('[Auth] refreshSession skipped.', { failureReason })
    }

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        const failureReason = `getUser: ${error.message}`
        failures.push(failureReason)
        console.warn('[Auth] getUser failed.', { failureReason })
      } else if (user) {
        console.info('[Auth] getUser returned a user. Re-checking for a hydrated session.')

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          const failureReason = `getUser->getSession: ${sessionError.message}`
          failures.push(failureReason)
          console.warn('[Auth] Session hydration after getUser failed.', { failureReason })
        } else if (isValidSession(session)) {
          console.info('[Auth] Session recovered after getUser validation.')
          return { session, source: 'getUser', failures }
        } else {
          const failureReason = 'getUser returned a user but no active session was available'
          failures.push(failureReason)
          console.warn('[Auth] getUser did not produce a reusable session.')
        }
      } else {
        console.info('[Auth] getUser returned no authenticated user.')
      }
    } catch (error) {
      const failureReason = `getUser: ${formatError(error)}`
      failures.push(failureReason)
      console.error('[Auth] getUser threw unexpectedly.', { failureReason })
    }

    return {
      session: null,
      source: 'none',
      failures,
    }
  }

  const syncAuthState = async ({
    reason,
    sessionHint = null,
    isInitialLoad = false,
  }: {
    reason: string
    sessionHint?: Session | null
    isInitialLoad?: boolean
  }) => {
    const runId = authRunIdRef.current + 1
    authRunIdRef.current = runId

    if (isInitialLoad) {
      armInitializationTimeout(runId)
    }

    try {
      const recovery = isValidSession(sessionHint)
        ? {
            session: sessionHint,
            source: 'event' as const,
            failures: [] as string[],
          }
        : await recoverSession()

      console.info('[Auth] Session source selected.', {
        reason,
        sessionSource: recovery.source,
        failures: recovery.failures,
      })

      if (runId !== authRunIdRef.current) {
        console.info('[Auth] Ignoring stale auth sync result.', {
          reason,
          runId,
          currentRunId: authRunIdRef.current,
        })
        return
      }

      if (!recovery.session) {
        const shouldClearStorage = recovery.failures.some((failure) => looksLikeAuthFailure(failure))

        if (shouldClearStorage) {
          console.warn('[Auth] Clearing stale persisted auth after failed recovery.', {
            reason,
            failures: recovery.failures,
          })
          clearSupabaseAuthStorage()
        }

        resolveAuthState(
          {
            user: null,
            profile: null,
            error: null,
          },
          `${reason}:no-session`,
          runId
        )
        return
      }

      const profileResult = await fetchProfileData(recovery.session.user.id)

      if (runId !== authRunIdRef.current) {
        console.info('[Auth] Ignoring stale profile result.', {
          reason,
          runId,
          currentRunId: authRunIdRef.current,
        })
        return
      }

      if (profileResult.shouldForceLogout) {
        console.warn('[Auth] Profile fetch proved the session is invalid. Forcing logout.', {
          reason,
          failureReason: profileResult.failureReason,
        })

        await performClientSignOut(profileResult.failureReason || `${reason}:invalid-session`)
        return
      }

      if (profileResult.failureReason) {
        console.warn('[Auth] Continuing with authenticated user but without a loaded profile.', {
          reason,
          failureReason: profileResult.failureReason,
        })
      }

      resolveAuthState(
        {
          user: recovery.session.user,
          profile: profileResult.profile,
          error: null,
        },
        `${reason}:${recovery.source}`,
        runId
      )
    } catch (error) {
      console.error('[Auth] Unexpected auth sync failure.', {
        reason,
        failureReason: formatError(error),
      })

      if (runId !== authRunIdRef.current) {
        return
      }

      resolveAuthState(
        {
          user: null,
          profile: null,
          error: null,
        },
        `${reason}:unexpected-failure`,
        runId
      )
    } finally {
      if (isInitialLoad && runId === authRunIdRef.current) {
        clearAuthTimeout()
      }
    }
  }

  const refreshProfile = async () => {
    const currentUser = stateRef.current.user

    if (!currentUser) {
      console.info('[Auth] refreshProfile skipped because there is no authenticated user.')
      return
    }

    const profileResult = await fetchProfileData(currentUser.id)

    if (profileResult.shouldForceLogout) {
      await performClientSignOut(profileResult.failureReason || 'refresh-profile-invalid-session')
      return
    }

    if (profileResult.failureReason) {
      console.warn('[Auth] refreshProfile completed without profile data.', {
        failureReason: profileResult.failureReason,
      })
    }

    setState((previousState) => {
      if (!previousState.user || previousState.user.id !== currentUser.id) {
        return previousState
      }

      const nextState = {
        ...previousState,
        profile: profileResult.profile,
        loading: false,
      }

      stateRef.current = nextState
      return nextState
    })
  }

  const signOut = async () => {
    await performClientSignOut('manual')
  }

  const hardReset = () => {
    console.warn('[Auth] Performing hard reset of auth state.')

    void performClientSignOut('hard-reset').finally(() => {
      if (typeof window !== 'undefined') {
        window.location.assign('/login')
      }
    })
  }

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (initStartedRef.current) {
      return
    }

    initStartedRef.current = true

    if (!isSupabaseConfigured) {
      console.error('[Auth] Supabase URL or anon key is missing. Auth initialization cannot continue.')

      resolveAuthState(
        {
          user: null,
          profile: null,
          error: 'Missing Supabase configuration. Please check your environment variables.',
        },
        'config-missing'
      )

      return
    }

    void syncAuthState({
      reason: 'initial-load',
      isInitialLoad: true,
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.info('[Auth Event] Received auth state change.', {
        event,
        hasSession: Boolean(session),
        userId: session?.user?.id ?? null,
      })

      if (event === 'INITIAL_SESSION') {
        console.info('[Auth Event] INITIAL_SESSION observed. Initial recovery is handled explicitly by AuthProvider.')
        return
      }

      if (event === 'SIGNED_OUT') {
        applyLoggedOutState('auth-event:SIGNED_OUT')
        return
      }

      if (AUTH_EVENTS_TO_SYNC.has(event)) {
        void syncAuthState({
          reason: `auth-event:${event}`,
          sessionHint: session,
        })
      }
    })

    return () => {
      clearAuthTimeout()
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, signOut, hardReset, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
