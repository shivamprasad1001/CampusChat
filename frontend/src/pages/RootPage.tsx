import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-indigo-100 dark:border-indigo-900 border-t-indigo-600 animate-spin"></div>
          <div className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400 font-sans">Loading CampusChat...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 font-sans">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center ring-1 ring-black/5">
          <div className="mx-auto w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Connection Issues</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">{error}</p>
          <Button 
            onClick={() => navigateToGeneral()} 
            disabled={isRetrying}
            size="lg"
            className="w-full flex items-center justify-center gap-3 py-6 text-lg transition-all active:scale-95 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isRetrying ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
            {isRetrying ? 'Retrying...' : 'Retry Connection'}
          </Button>
        </div>
      </div>
    )
  }

  return null
}
