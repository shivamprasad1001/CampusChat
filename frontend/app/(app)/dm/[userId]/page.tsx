'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function DMPage() {
  const { userId } = useParams()
  const router = useRouter()

  useEffect(() => {
    const handleDM = async () => {
      try {
        const { data: room } = await api.get(`/dm/${userId}`)
        router.push(`/rooms/${room.id}`)
      } catch (err) {
        console.error('Failed to handle DM', err)
        router.push('/')
      }
    }
    handleDM()
  }, [userId, router])

  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  )
}
