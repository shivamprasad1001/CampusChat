import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { Room } from '@/types'
import { AxiosError } from 'axios'

export default function RootPage() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  const navigateToGeneral = useCallback(async () => {
    if (!user) return
    
    setError(null)
    setIsRetrying(true)

    try {
      const { data } = await api.get<Room[]>('/rooms')
      
      if (!data || data.length === 0) {
        setError('No rooms found. Please contact support.')
        return
      }

      const generalRoom = data.find((r: Room) => r.name === 'general')
      const targetRoom = generalRoom || data[0]
      
      if (targetRoom) {
        navigate(`/rooms/${targetRoom.id}`)
      }
    } catch (err: unknown) {
      console.error('Failed to fetch rooms:', err)
      
      const axiosError = err as AxiosError<{ error: string }>
      const status = axiosError.response?.status
      if (status === 401) {
        setError('Session expired. Please log in again.')
        navigate('/login')
      } else if (status === 500) {
        setError('Server error while loading rooms. Our team is investigating.')
      } else if (axiosError.code === 'ERR_NETWORK' || !axiosError.response) {
        setError('Unable to reach the backend. Please make sure the backend server is running and your network is connected.')
      } else {
        setError('Failed to connect to the server. Please check your internet connection.')
      }
    } finally {
      setIsRetrying(false)
    }
  }, [user, navigate])

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      navigate('/login')
    } else {
      navigateToGeneral()
    }
  }, [user, authLoading, navigate, navigateToGeneral])

  if (authLoading || (user && !error)) {
    return (
      <div className="app-shell flex min-h-[100dvh] flex-col items-center justify-center gap-4">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--accent)]" />
        </div>
        <p className="text-[13px] font-medium text-[var(--text-secondary)]">Loading CampusChat…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-shell flex min-h-[100dvh] items-center justify-center p-4">
        <div className="w-full max-w-[420px] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-glass-heavy)] p-8 text-center shadow-[var(--shadow-xl)] backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--danger)]/10 border border-[var(--danger)]/15">
            <AlertCircle className="h-7 w-7 text-[var(--danger)]" />
          </div>
          <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">Connection Issues</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">{error}</p>
          <button
            onClick={() => navigateToGeneral()}
            disabled={isRetrying}
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--accent)] font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--accent-hover)] active:scale-[0.98] disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying…' : 'Retry Connection'}
          </button>
        </div>
      </div>
    )
  }

  return null
}
