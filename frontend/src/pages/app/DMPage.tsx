import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { Room } from '@/types'

export default function DMPage() {
  const { userId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const handleDM = async () => {
      try {
        const { data: room } = await api.get<Room>(`/dm/${userId}`)
        navigate(`/rooms/${room.id}`)
      } catch (err) {
        console.error('Failed to handle DM', err)
        navigate('/')
      }
    }
    handleDM()
  }, [userId, navigate])

  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  )
}
