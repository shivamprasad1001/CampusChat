import { useEffect, useState } from 'react'
import { Bell, Check, AtSign } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  is_read: boolean
  created_at: string
  profiles: {
    name: string
    avatar_url: string
    username: string
  }
  messages: {
    content: string
    room_id: string
  }
}

export default function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const unreadCount = notifications.filter((n) => !n.is_read).length

  useEffect(() => {
    if (user) {
      fetchNotifications()
      
      // Subscribe to new notifications via socket (or Supabase realtime)
      const channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchNotifications()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  async function fetchNotifications() {
    try {
      const response = await api.get('/notifications')
      setNotifications(response.data)
    } catch (err) {
      console.error('[Notifications] Fetch error:', err)
    }
  }

  async function markAsRead(id: string) {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch (err) {
      console.error('[Notifications] Mark read error:', err)
    }
  }

  async function markAllAsRead() {
    try {
      await api.post('/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (err) {
      console.error('[Notifications] Mark all read error:', err)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        >
          <Bell className="h-4 w-4" strokeWidth={1.8} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-[var(--bg-surface)]">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0 overflow-hidden rounded-[var(--radius-lg)] border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-2xl)]">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-hover)] px-4 py-2.5">
          <span className="text-[12px] font-bold text-[var(--text-primary)]">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[10px] font-semibold text-[var(--accent)] hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-surface)] text-[var(--text-muted)]">
                <Bell className="h-5 w-5 opacity-20" />
              </div>
              <p className="text-[12px] font-medium text-[var(--text-muted)]">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "group relative flex cursor-pointer gap-3 p-4 transition-colors hover:bg-[var(--bg-hover)]",
                    !notif.is_read && "bg-[var(--accent-muted)]/5"
                  )}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] bg-opacity-10 text-[var(--accent)]">
                    <AtSign className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-[var(--text-secondary)]">
                      <span className="font-bold text-[var(--text-primary)]">{notif.profiles.name}</span>
                      {" mentioned you in a message."}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11px] italic text-[var(--text-muted)]">
                      "{notif.messages.content}"
                    </p>
                    <time className="mt-1.5 block text-[10px] text-[var(--text-muted)]">
                      {format(new Date(notif.created_at), 'Pp')}
                    </time>
                  </div>
                  {!notif.is_read && (
                    <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-[var(--accent)]" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2">
          <Button variant="ghost" className="w-full h-8 text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            View All Activity
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
