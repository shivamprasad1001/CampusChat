'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Room } from '@/types'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Hash, Lock, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function RoomList() {
  const [rooms, setRooms] = useState<Room[]>([])
  const { roomId } = useParams()

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data } = await api.get('/rooms')
        setRooms(data)
      } catch (err) {
        console.error('Failed to fetch rooms', err)
      }
    }
    fetchRooms()
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Channels
        </h3>
        <div className="mt-2 space-y-1">
          {rooms.filter(r => r.type !== 'dm').map((room) => (
            <Link
              key={room.id}
              href={`/rooms/${room.id}`}
              className={cn(
                "group flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                roomId === room.id
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50"
              )}
            >
              {room.type === 'public' ? (
                <Hash className="mr-3 h-4 w-4" />
              ) : (
                <Lock className="mr-3 h-4 w-4" />
              )}
              {room.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
