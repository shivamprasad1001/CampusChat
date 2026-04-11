'use client'

import { useParams } from 'next/navigation'
import { useMessages } from '@/hooks/useMessages'
import { useAuth } from '@/hooks/useAuth'
import MessageList from '@/components/chat/MessageList'
import MessageInput from '@/components/chat/MessageInput'
import RoomMembersPanel from '@/components/chat/RoomMembersPanel'
import {
  Hash,
  Menu,
  PanelRight,
  Pin,
  Search,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import api from '@/lib/api'
import { Profile, Room } from '@/types'
import { useAppShell } from '@/components/app-shell/AppShellContext'

export default function RoomPage() {
  const { roomId } = useParams()
  const { user, profile } = useAuth()
  const { messages, sendMessage, sendTyping, toggleReaction, typingUsers } = useMessages(
    roomId as string
  )
  const [room, setRoom] = useState<Room | null>(null)
  const { toggleMobileSidebar, membersPanelOpen, toggleMembersPanel } = useAppShell()

  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const { data } = await api.get('/rooms')
        const currentRoom = data.find((entry: Room) => entry.id === roomId)
        setRoom(currentRoom)
      } catch (error) {
        console.error('Failed to fetch room details', error)
      }
    }

    fetchRoomDetails()
  }, [roomId])

  const memberList = useMemo(() => {
    const membersMap = new Map<string, Partial<Profile> & { id: string; isOnline?: boolean }>()

    if (profile && user) {
      membersMap.set(user.id, {
        ...profile,
        id: user.id,
        isOnline: true,
      })
    }

    messages.forEach((message) => {
      if (!membersMap.has(message.sender_id)) {
        membersMap.set(message.sender_id, {
          id: message.sender_id,
          name: message.profiles?.name || 'Unknown user',
          avatar_url: message.profiles?.avatar_url,
          isOnline: typingUsers.some((typingUser) => typingUser.userId === message.sender_id),
        })
      }
    })

    return Array.from(membersMap.values()).sort((left, right) => {
      if (left.isOnline === right.isOnline) {
        return (left.name || '').localeCompare(right.name || '')
      }

      return left.isOnline ? -1 : 1
    })
  }, [messages, profile, typingUsers, user])

  const handleSendMessage = (content: string, fileUrl?: string) => {
    if (!user) return
    sendMessage(content, fileUrl, user.id)
  }

  const handleTyping = () => {
    if (!user || !profile) return
    sendTyping(user.id, profile.name)
  }

  if (!room) return null

  return (
    <div className="flex min-h-0 flex-1 bg-transparent">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[52px] items-center justify-between border-b border-[var(--border-subtle)] bg-[rgba(13,15,18,0.82)] px-3 backdrop-blur-xl md:px-4">
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={toggleMobileSidebar}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-[18px] w-[18px]" strokeWidth={1.7} />
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--accent)]">
              <Hash className="h-[18px] w-[18px]" strokeWidth={1.7} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate font-display text-[21px] font-semibold tracking-[-0.03em] text-[var(--text-primary)] md:text-[24px]">
                #{room.name}
              </h1>
              <p className="truncate text-[11px] text-[var(--text-secondary)]">
                {room.description || 'Focused discussion space for the team.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <HeaderIconButton label="Search">
              <Search className="h-4 w-4" strokeWidth={1.6} />
            </HeaderIconButton>
            <HeaderIconButton label="Members" onClick={toggleMembersPanel}>
              <Users className="h-4 w-4" strokeWidth={1.6} />
            </HeaderIconButton>
            <HeaderIconButton label="Pinned messages">
              <Pin className="h-4 w-4" strokeWidth={1.6} />
            </HeaderIconButton>
            <HeaderIconButton label="Toggle details" className="xl:hidden" onClick={toggleMembersPanel}>
              <PanelRight className="h-4 w-4" strokeWidth={1.6} />
            </HeaderIconButton>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <MessageList
            messages={messages}
            roomName={room.name}
            onToggleReaction={(messageId, emoji) => user && toggleReaction(messageId, emoji, user.id)}
          />

          <div className="mx-auto w-full max-w-[960px] px-4">
            <TypingIndicator names={typingUsers.map((entry) => entry.name)} />
          </div>

          <MessageInput onSendMessage={handleSendMessage} onTyping={handleTyping} />
        </div>
      </div>

      <RoomMembersPanel members={memberList} open={membersPanelOpen} />
    </div>
  )
}

function HeaderIconButton({
  children,
  label,
  className,
  onClick,
}: {
  children: React.ReactNode
  label: string
  className?: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] ${className || ''}`}
      aria-label={label}
    >
      {children}
    </button>
  )
}

function TypingIndicator({ names }: { names: string[] }) {
  if (names.length === 0) {
    return <div className="h-7" aria-hidden="true" />
  }

  const label = `${names.join(', ')} ${names.length === 1 ? 'is' : 'are'} typing...`

  return (
    <div className="flex h-7 items-center gap-2 px-1 text-[12px] italic text-[var(--text-muted)]">
      <div className="flex items-center gap-1" aria-hidden="true">
        <span
          className="h-1.5 w-1.5 rounded-full bg-[var(--text-secondary)]"
          style={{ animation: 'typing-dot 900ms infinite' }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-[var(--text-secondary)]"
          style={{ animation: 'typing-dot 900ms 150ms infinite' }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-[var(--text-secondary)]"
          style={{ animation: 'typing-dot 900ms 300ms infinite' }}
        />
      </div>
      <span>{label}</span>
    </div>
  )
}
