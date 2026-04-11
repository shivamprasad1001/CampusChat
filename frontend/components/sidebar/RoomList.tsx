'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Room } from '@/types'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Hash, Lock, MessageSquare, Plus } from 'lucide-react'
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

  const channels = rooms.filter((room) => room.type !== 'dm')
  const directMessages = rooms.filter((room) => room.type === 'dm')

  return (
    <div className="space-y-5 pb-3">
      <section>
        <div className="mb-2 flex items-center justify-between px-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Channels
          </h3>
          <button
            type="button"
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            aria-label="Create channel"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.7} />
          </button>
        </div>
        <div className="space-y-1">
          {channels.map((room) => (
            <RoomLink key={room.id} room={room} active={roomId === room.id} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 px-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Direct Messages
          </h3>
        </div>
        <div className="space-y-1">
          {directMessages.map((room, index) => (
            <Link
              key={room.id}
              href={`/rooms/${room.id}`}
              className={cn(
                'group flex h-[34px] items-center gap-3 rounded-[10px] px-3 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
                roomId === room.id &&
                  'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-[inset_3px_0_0_var(--accent)]'
              )}
            >
              <div className="relative flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[11px] font-semibold text-[var(--text-primary)]">
                {room.name.slice(0, 2).toUpperCase()}
                <span
                  className={cn(
                    'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg-surface)]',
                    index % 2 === 0 ? 'bg-[var(--online)]' : 'bg-[var(--text-muted)]'
                  )}
                />
              </div>
              <span className="truncate">{room.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function RoomLink({
  room,
  active,
}: {
  room: Room
  active: boolean
}) {
  return (
    <Link
      href={`/rooms/${room.id}`}
      className={cn(
        'group flex h-[34px] items-center gap-3 rounded-[10px] px-3 text-[13px] font-medium text-[var(--text-secondary)] transition-all',
        active
          ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-[inset_3px_0_0_var(--accent)]'
          : 'hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
      )}
    >
      <span className="flex h-4 w-4 items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">
        {room.type === 'public' ? (
          <Hash className="h-3.5 w-3.5" strokeWidth={1.7} />
        ) : room.type === 'private' ? (
          <Lock className="h-3.5 w-3.5" strokeWidth={1.7} />
        ) : (
          <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.7} />
        )}
      </span>
      <span className="truncate">{room.name}</span>
    </Link>
  )
}
