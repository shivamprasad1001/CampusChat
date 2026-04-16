import { useEffect, useState, useRef } from 'react'
import { useAppShell } from '@/components/app-shell/AppShellContext'
import { Message } from '@/types'
import { supabase } from '@/lib/supabase'
import api from '@/lib/api'
import MessageItem from './MessageItem'
import MessageInput from './MessageInput'
import { X, CornerDownRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getSocket } from '@/lib/socket'

export default function ThreadPanel() {
  const { activeThreadId, threadPanelOpen, closeThread } = useAppShell()
  const [parentMessage, setParentMessage] = useState<Message | null>(null)
  const [replies, setReplies] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeThreadId && threadPanelOpen) {
      fetchThreadData()
    }
  }, [activeThreadId, threadPanelOpen])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [replies])

  async function fetchThreadData() {
    setLoading(true)
    try {
      // 1. Fetch parent message
      const { data: parent } = await supabase
        .from('messages')
        .select('*, profiles:sender_id(name, avatar_url, username)')
        .eq('id', activeThreadId)
        .single()

      setParentMessage(parent as Message)

      // 2. Fetch replies via our updated history API
      if (parent) {
        const { data: threadReplies } = await api.get(`/messages/${parent.room_id}?parentId=${activeThreadId}`)
        setReplies(threadReplies || [])
      }
    } catch (err) {
      console.error('[Thread] Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Socket listener for new replies in this thread
  useEffect(() => {
    if (!activeThreadId) return

    const s = getSocket(user?.id)

    s.on('new_message', (message: Message) => {
      if (message.parent_id === activeThreadId) {
        setReplies((prev) => {
          if (prev.find(r => r.id === message.id)) return prev
          return [...prev, message]
        })
      }
    })

    s.on('message_deleted', ({ messageId }) => {
      setReplies((prev) => prev.map(m => 
        m.id === messageId ? { ...m, is_deleted: true, content: undefined } : m
      ))
      if (activeThreadId === messageId) {
        setParentMessage(prev => prev ? { ...prev, is_deleted: true, content: undefined } : null)
      }
    })

    return () => {
      s.off('new_message')
      s.off('message_deleted')
    }
  }, [activeThreadId, user?.id])

  if (!threadPanelOpen || !activeThreadId) return null

  const handleSendReply = (content: string, fileUrl?: string) => {
    if (!user || !parentMessage) return
    const s = getSocket(user.id)
    s.emit('send_message', { 
      roomId: parentMessage.room_id, 
      content, 
      fileUrl, 
      userId: user.id, 
      parentId: activeThreadId 
    })
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-2xl)] transition-all animate-in slide-in-from-right duration-300 sm:relative sm:w-[400px]">
      {/* Header */}
      <div className="flex h-[52px] items-center justify-between border-b border-[var(--border-subtle)] px-4">
        <div className="flex items-center gap-2">
          <CornerDownRight className="h-4 w-4 text-[var(--accent)]" />
          <h3 className="text-[14px] font-bold text-[var(--text-primary)]">Thread</h3>
        </div>
        <button
          onClick={closeThread}
          className="rounded-full p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-col gap-6 py-6">
            {/* Original Message */}
            {parentMessage && (
              <div className="border-b border-[var(--border-subtle)] pb-6">
                <MessageItem
                  message={parentMessage}
                  isOwn={parentMessage.sender_id === user?.id}
                  showHeader={true}
                  onToggleReaction={() => {}}
                  onReply={() => {}}
                  onTogglePin={() => {}}
                  onEditMessage={() => {}}
                  onDeleteMessage={() => {}}
                />
              </div>
            )}

            {/* Replies List */}
            <div className="space-y-1">
              <div className="px-4 mb-4 flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
                </span>
                <div className="h-px flex-1 bg-[var(--border-subtle)]" />
              </div>
              
              {replies.map((reply) => (
                <MessageItem
                  key={reply.id}
                  message={reply}
                  isOwn={reply.sender_id === user?.id}
                  showHeader={true}
                  onToggleReaction={() => {}}
                  onReply={() => {}}
                  onTogglePin={() => {}}
                  onEditMessage={() => {}}
                  onDeleteMessage={() => {}}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reply Input */}
      {parentMessage && (
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
          <MessageInput
            onSendMessage={handleSendReply}
            onTyping={() => {}}
            placeholder={`Reply to ${parentMessage.profiles?.name || 'thread'}...`}
          />
        </div>
      )}
    </aside>
  )
}
