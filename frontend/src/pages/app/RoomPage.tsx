import { useParams } from 'react-router-dom'
import { useMessages } from '@/hooks/useMessages'
import { useAuth } from '@/hooks/useAuth'
import MessageList from '@/components/chat/MessageList'
import MessageInput from '@/components/chat/MessageInput'
import RoomMembersPanel from '@/components/chat/RoomMembersPanel'
import {
  Hash,
  Menu,
  Pin,
  Search,
  Users,
  Plus,
} from 'lucide-react'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import api from '@/lib/api'
import { Message, Profile, Room } from '@/types'
import { useAppShell } from '@/components/app-shell/AppShellContext'

export default function RoomPage() {
  const { roomId } = useParams()
  const { user, profile } = useAuth()
  const { 
    messages, 
    sendMessage, 
    sendTyping, 
    toggleReaction, 
    togglePin, 
    editMessage,
    deleteMessage,
    fetchMoreMessages,
    hasMore,
    isLoadingMore,
    typingUsers, 
    onlineUserIds 
  } = useMessages(roomId as string)
  
  const [room, setRoom] = useState<Room | null>(null)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const { toggleMobileSidebar, membersPanelOpen, toggleMembersPanel, focusSearch } = useAppShell()

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

    messages.forEach((message: Message) => {
      if (!membersMap.has(message.sender_id)) {
        membersMap.set(message.sender_id, {
          id: message.sender_id,
          name: message.profiles?.name || 'Unknown user',
          avatar_url: message.profiles?.avatar_url,
          isOnline: onlineUserIds.includes(message.sender_id),
        })
      } else {
        // Update online status for existing members in the map
        const existing = membersMap.get(message.sender_id)!
        existing.isOnline = onlineUserIds.includes(message.sender_id)
      }
    })

    return Array.from(membersMap.values()).sort((left, right) => {
      if (left.isOnline === right.isOnline) {
        return (left.name || '').localeCompare(right.name || '')
      }

      return left.isOnline ? -1 : 1
    })
  }, [messages, profile, onlineUserIds, user])

  const handleSendMessage = (content: string, fileUrl?: string) => {
    if (!user) return
    sendMessage(content, fileUrl, user.id, replyingTo?.id)
    setReplyingTo(null)
  }

  const handleTyping = () => {
    if (!user || !profile) return
    sendTyping(user.id, profile.name)
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file || !user) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await api.post('/upload', formData)
      handleSendMessage('', data.url)
    } catch (error) {
      console.error('Drop upload failed', error)
    }
  }, [user, handleSendMessage])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    noClick: true,
    noKeyboard: true 
  })

  if (!room) return null

  return (
    <div {...getRootProps()} className="flex min-h-0 flex-1 bg-transparent relative">
      <input {...getInputProps()} />
      
      {/* Drag overlay */}
      {isDragActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center glass-panel-heavy m-3 rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--accent)]">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--accent-muted)] shadow-[var(--shadow-glow)]">
              <Plus className="h-8 w-8 text-[var(--accent)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Drop file to share in #{room.name}</h3>
            <p className="text-[13px] text-[var(--text-secondary)]">The file will be uploaded and sent</p>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-[52px] items-center justify-between border-b border-[var(--border-subtle)] glass-panel-heavy px-3 md:px-4">
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={toggleMobileSidebar}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" strokeWidth={1.8} />
            </button>

            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--accent)]">
              <Hash className="h-4 w-4" strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate font-display text-[15px] font-bold tracking-tight text-[var(--text-primary)]">
                {room.name}
              </h1>
              <p className="hidden truncate text-[11px] text-[var(--text-muted)] sm:block">
                {room.description || 'Focused discussion space'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <HeaderIconButton label="Search" onClick={focusSearch} className="hidden sm:flex">
              <Search className="h-3.5 w-3.5" strokeWidth={1.7} />
            </HeaderIconButton>
            <HeaderIconButton label="Pinned messages" className="hidden sm:flex">
              <Pin className="h-3.5 w-3.5" strokeWidth={1.7} />
            </HeaderIconButton>
            <HeaderIconButton
              label="Members"
              onClick={toggleMembersPanel}
              className={membersPanelOpen ? 'bg-[var(--accent-muted)] text-[var(--accent)]' : ''}
            >
              <Users className="h-3.5 w-3.5" strokeWidth={1.7} />
            </HeaderIconButton>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <MessageList
            messages={messages}
            roomName={room.name}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onFetchMore={fetchMoreMessages}
            onToggleReaction={(messageId: string, emoji: string) => user && toggleReaction(messageId, emoji, user.id)}
            onReply={setReplyingTo}
            onTogglePin={togglePin}
            onEditMessage={(messageId: string, content: string) => user && editMessage(messageId, content, user.id)}
            onDeleteMessage={(messageId: string) => user && deleteMessage(messageId, user.id)}
          />

          <div className="mx-auto w-full max-w-[960px] px-4">
            <TypingIndicator names={typingUsers.map((entry: { userId: string; name: string }) => entry.name)} />
          </div>

          <MessageInput 
            onSendMessage={handleSendMessage} 
            onTyping={handleTyping} 
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
          />
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
      className={`inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] ${className || ''}`}
      aria-label={label}
    >
      {children}
    </button>
  )
}

function TypingIndicator({ names }: { names: string[] }) {
  if (names.length === 0) {
    return <div className="h-6" aria-hidden="true" />
  }

  const label = `${names.join(', ')} ${names.length === 1 ? 'is' : 'are'} typing...`

  return (
    <div className="flex h-6 items-center gap-2 px-1 text-[11px] italic text-[var(--text-muted)]">
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
