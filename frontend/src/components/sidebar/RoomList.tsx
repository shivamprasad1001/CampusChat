import { useEffect, useState, useMemo } from 'react'
import api from '@/lib/api'
import { Room } from '@/types'
import { Link, useParams } from 'react-router-dom'
import { ChevronDown, Hash, Lock, MessageSquare, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppShell } from '@/components/app-shell/AppShellContext'
import { useAuth } from '@/hooks/useAuth'

const ROOMS_CACHE_KEY = 'campus_chat_rooms_v1'

export default function RoomList() {
  const { user, loading: authLoading } = useAuth()
  const [rooms, setRooms] = useState<Room[]>(() => {
    // Instant Loading: Initialize from cache if available
    try {
      const cached = localStorage.getItem(ROOMS_CACHE_KEY)
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })
  
  const [loading, setLoading] = useState(!rooms.length)
  const [error, setError] = useState<string | null>(null)
  const [channelsOpen, setChannelsOpen] = useState(true)
  const [dmsOpen, setDmsOpen] = useState(true)
  const { roomId } = useParams()
  const { searchQuery, setMobileSidebarOpen } = useAppShell()

  useEffect(() => {
    // Wait for auth to at least attempt rehydration
    if (authLoading) return

    const fetchRooms = async () => {
      // If we're not logged in, clear list and stop
      if (!user) {
        setRooms([])
        setLoading(false)
        return
      }

      // If we have rooms from cache, we don't show the skeleton during refresh
      if (!rooms.length) setLoading(true)
      
      setError(null)

      try {
        const { data } = await api.get('/rooms')
        setRooms(data)
        // Update cache for next refresh
        localStorage.setItem(ROOMS_CACHE_KEY, JSON.stringify(data))
      } catch (err) {
        console.error('Failed to fetch rooms', err)
        // Only show full error UI if we have zero data to show
        if (!rooms.length) {
          setError('Unable to load rooms. Please refresh the page or try again later.')
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchRooms()
  }, [user, authLoading])

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const channels = filteredRooms.filter((room) => room.type !== 'dm')
  const directMessages = filteredRooms.filter((room) => room.type === 'dm')

  const handleRoomClick = () => {
    setMobileSidebarOpen(false)
  }

  if (loading) {
    return (
      <div className="space-y-2 px-2 py-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex h-8 items-center gap-3 px-3">
            <div className="h-3.5 w-3.5 rounded bg-[var(--bg-hover)] animate-pulse" />
            <div className="h-3 rounded bg-[var(--bg-hover)] animate-pulse" style={{ width: `${40 + i * 12}%` }} />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-[12px] text-[var(--danger)]">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-3">
      {/* Channels Section */}
      <section>
        <button
          type="button"
          onClick={() => setChannelsOpen(!channelsOpen)}
          className="mb-1 flex w-full items-center justify-between px-2 py-1 hover:text-[var(--text-primary)]"
        >
          <span className="flex items-center gap-1.5">
            <ChevronDown
              className={cn(
                "h-3 w-3 text-[var(--text-muted)] transition-transform duration-200",
                !channelsOpen && "-rotate-90"
              )}
              strokeWidth={2}
            />
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Channels
            </span>
          </span>
          <button
            type="button"
            className="inline-flex h-5 w-5 items-center justify-center rounded-[4px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            aria-label="Create channel"
            onClick={(e) => e.stopPropagation()}
          >
            <Plus className="h-3 w-3" strokeWidth={2} />
          </button>
        </button>

        {channelsOpen && (
          <div className="space-y-0.5" style={{ animation: 'chat-enter 200ms var(--ease-spring)' }}>
            {channels.map((room) => (
              <RoomLink key={room.id} room={room} active={roomId === room.id} onClick={handleRoomClick} />
            ))}
          </div>
        )}
      </section>

      {/* Direct Messages Section */}
      <section>
        <button
          type="button"
          onClick={() => setDmsOpen(!dmsOpen)}
          className="mb-1 flex w-full items-center justify-between px-2 py-1 hover:text-[var(--text-primary)]"
        >
          <span className="flex items-center gap-1.5">
            <ChevronDown
              className={cn(
                "h-3 w-3 text-[var(--text-muted)] transition-transform duration-200",
                !dmsOpen && "-rotate-90"
              )}
              strokeWidth={2}
            />
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Direct Messages
            </span>
          </span>
        </button>

        {dmsOpen && (
          <div className="space-y-0.5" style={{ animation: 'chat-enter 200ms var(--ease-spring)' }}>
            {directMessages.map((room, index) => (
              <Link
                key={room.id}
                to={`/rooms/${room.id}`}
                onClick={handleRoomClick}
                className={cn(
                  'group flex h-[34px] items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 text-[13px] text-[var(--text-secondary)] transition-all duration-150',
                  roomId === room.id
                    ? 'bg-[var(--accent-muted)] text-[var(--text-primary)]'
                    : 'hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                )}
              >
                <div className="relative flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: createAvatarGradient(room.name) }}
                >
                  {room.name.slice(0, 2).toUpperCase()}
                  <span
                    className={cn(
                      'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-[1.5px] border-[var(--bg-surface)]',
                      index % 2 === 0 ? 'bg-[var(--online)]' : 'bg-[var(--text-muted)]'
                    )}
                  />
                </div>
                <span className="truncate text-[12px]">{room.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {filteredRooms.length === 0 && searchQuery && (
        <div className="px-4 py-8 text-center">
          <p className="text-[12px] text-[var(--text-muted)]">No results for "{searchQuery}"</p>
        </div>
      )}
    </div>
  )
}

function RoomLink({
  room,
  active,
  onClick,
}: {
  room: Room
  active: boolean
  onClick: () => void
}) {
  return (
    <Link
      to={`/rooms/${room.id}`}
      onClick={onClick}
      className={cn(
        'group flex h-[32px] items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 text-[12px] font-medium transition-all duration-150',
        active
          ? 'bg-[var(--accent-muted)] text-[var(--text-primary)] shadow-[var(--shadow-xs)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
      )}
    >
      {/* Active indicator pill */}
      <span className={cn(
        "h-[6px] w-[3px] rounded-full transition-all",
        active ? "bg-[var(--accent)]" : "bg-transparent"
      )} />
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

function createAvatarGradient(name: string) {
  let hash = 0
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `linear-gradient(135deg, hsl(${hue} 70% 58%), hsl(${(hue + 32) % 360} 56% 42%))`
}
