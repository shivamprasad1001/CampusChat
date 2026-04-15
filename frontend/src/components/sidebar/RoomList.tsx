import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Room } from '@/types'
import { Link, useParams } from 'react-router-dom'
import { Hash, Lock, MessageSquare, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppShell } from '@/components/app-shell/AppShellContext'

export default function RoomList() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { roomId } = useParams()
  const { searchQuery } = useAppShell()

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data } = await api.get('/rooms')
        setRooms(data)
      } catch (err) {
        console.error('Failed to fetch rooms', err)
        setError('Unable to load rooms. Please refresh the page or try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchRooms()
  }, [])

  const filteredRooms = rooms.filter((room) => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const channels = filteredRooms.filter((room) => room.type !== 'dm')
  const directMessages = filteredRooms.filter((room) => room.type === 'dm')

  if (loading) {
    return (
      <div className="space-y-5 pb-3 px-2 text-[var(--text-muted)]">
        <p className="text-sm">Loading rooms…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-5 pb-3 px-2 text-[var(--text-muted)]">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    )
  }

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
              to={`/rooms/${room.id}`}
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
      {filteredRooms.length === 0 && searchQuery && (
        <div className="px-4 py-8 text-center">
          <p className="text-[13px] text-[var(--text-muted)]">No results for "{searchQuery}"</p>
        </div>
      )}
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
      to={`/rooms/${room.id}`}
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
