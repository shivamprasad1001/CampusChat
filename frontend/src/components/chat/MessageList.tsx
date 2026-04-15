
import { useEffect, useMemo, useRef, useState } from 'react'
import { Message } from '@/types'
import MessageItem from './MessageItem'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/useAuth'
import { format, isSameDay } from 'date-fns'
import { ArrowDown, Loader2 } from 'lucide-react'
import { useInView } from 'react-intersection-observer'

interface MessageListProps {
  messages: Message[]
  roomName: string
  hasMore?: boolean
  isLoadingMore?: boolean
  onFetchMore?: () => void
  onToggleReaction: (messageId: string, emoji: string) => void
  onReply: (message: Message) => void
  onTogglePin: (messageId: string) => void
  onEditMessage: (messageId: string, content: string) => void
  onDeleteMessage: (messageId: string) => void
}

export default function MessageList({
  messages,
  roomName,
  hasMore,
  isLoadingMore,
  onFetchMore,
  onToggleReaction,
  onReply,
  onTogglePin,
  onEditMessage,
  onDeleteMessage,
}: MessageListProps) {
  const { user } = useAuth()
  const scrollRef = useRef<HTMLDivElement>(null)
  const previousCountRef = useRef(messages.length)
  const [showJumpToLatest, setShowJumpToLatest] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const { ref: inViewRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px 0px 0px 0px',
  })

  useEffect(() => {
    if (inView && hasMore && onFetchMore && !isLoadingMore) {
      onFetchMore()
    }
  }, [inView, hasMore, onFetchMore, isLoadingMore])

  const items = useMemo(() => {
    return messages.map((message, index) => {
      const previousMessage = messages[index - 1]
      const showHeader =
        !previousMessage ||
        previousMessage.sender_id !== message.sender_id ||
        new Date(message.created_at).getTime() - new Date(previousMessage.created_at).getTime() >
          5 * 60 * 1000 ||
        !isSameDay(new Date(previousMessage.created_at), new Date(message.created_at))

      const showDateSeparator =
        !previousMessage ||
        !isSameDay(new Date(previousMessage.created_at), new Date(message.created_at))

      return { message, showHeader, showDateSeparator }
    })
  }, [messages])

  useEffect(() => {
    const viewport = scrollRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]'
    ) as HTMLDivElement | null

    if (!viewport) return

    const handleScroll = () => {
      const distanceFromBottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
      const atBottom = distanceFromBottom < 48
      setIsAtBottom(atBottom)
      if (atBottom) {
        setShowJumpToLatest(false)
      }
    }

    handleScroll()
    viewport.addEventListener('scroll', handleScroll)
    return () => viewport.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const viewport = scrollRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]'
    ) as HTMLDivElement | null

    if (!viewport) return

    const hasNewMessages = messages.length > previousCountRef.current
    previousCountRef.current = messages.length

    if (!hasNewMessages) return

    if (isAtBottom) {
      requestAnimationFrame(() => {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth',
        })
      })
      return
    }

    requestAnimationFrame(() => {
      setShowJumpToLatest(true)
    })
  }, [isAtBottom, messages])

  const scrollToBottom = () => {
    const viewport = scrollRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]'
    ) as HTMLDivElement | null

    if (!viewport) return

    viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' })
    setShowJumpToLatest(false)
  }

  if (messages.length === 0) {
    return (
      <div className="relative flex flex-1 items-center justify-center px-6 py-10">
        <div className="mx-auto flex max-w-[360px] flex-col items-center text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[24px] border border-[var(--border-subtle)] bg-[radial-gradient(circle_at_top,rgba(79,142,247,0.16),transparent_60%),var(--bg-surface)] shadow-[var(--shadow-md)]">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
              <rect x="8" y="11" width="36" height="25" rx="10" stroke="var(--accent)" strokeWidth="1.5" opacity="0.88" />
              <path d="M18 20H34M18 26H29" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M21 36L18 42L27 36" fill="var(--bg-surface)" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="font-display text-[22px] font-semibold text-[var(--text-primary)]">
            Welcome to #{roomName}
          </h2>
          <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
            This room is quiet for now. Start the thread and set the tone for the conversation.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-0 flex-1">
      <ScrollArea ref={scrollRef} className="h-full min-h-0 flex-1">
        <div
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          className="mx-auto flex w-full max-w-[960px] flex-col px-2 py-5 pb-10 md:px-4"
        >
          {hasMore && (
            <div ref={inViewRef} className="flex justify-center py-4">
              {isLoadingMore && <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />}
            </div>
          )}
          {items.map(({ message, showHeader, showDateSeparator }) => (
            <div key={message.id}>
              {showDateSeparator && (
                <div className="sticky top-4 z-10 my-4 flex justify-center">
                  <span className="rounded-full border border-[var(--border-subtle)] bg-[rgba(19,22,27,0.9)] px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] backdrop-blur-md">
                    {format(new Date(message.created_at), 'EEEE, MMMM d')}
                  </span>
                </div>
              )}
              <MessageItem
                message={message}
                isOwn={message.sender_id === user?.id}
                showHeader={showHeader}
                onToggleReaction={(emoji) => onToggleReaction(message.id, emoji)}
                onReply={onReply}
                onTogglePin={onTogglePin}
                onEditMessage={onEditMessage}
                onDeleteMessage={onDeleteMessage}
              />
            </div>
          ))}
        </div>
      </ScrollArea>

      {showJumpToLatest && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
          <button
            type="button"
            onClick={scrollToBottom}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[rgba(19,22,27,0.92)] px-3 py-2 text-[12px] font-medium text-[var(--text-primary)] shadow-[var(--shadow-md)] backdrop-blur-md hover:bg-[var(--bg-hover)]"
          >
            <ArrowDown className="h-3.5 w-3.5 text-[var(--accent)]" strokeWidth={1.8} />
            New messages
          </button>
        </div>
      )}
    </div>
  )
}
