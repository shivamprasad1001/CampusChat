
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Message } from '@/types'
import MessageItem from './MessageItem'
import { useAuth } from '@/hooks/useAuth'
import { format, isSameDay } from 'date-fns'
import { ArrowDown, Loader2, Lock } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'

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
  roomName: _roomName,
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

  // Memoized grouping logic
  const items = useMemo(() => {
    return messages.map((message, index) => {
      const previousMessage = messages[index - 1]
      const nextMessage = messages[index + 1]
      const showHeader =
        !previousMessage ||
        previousMessage.sender_id !== message.sender_id ||
        new Date(message.created_at).getTime() - new Date(previousMessage.created_at).getTime() >
        5 * 60 * 1000 ||
        !isSameDay(new Date(previousMessage.created_at), new Date(message.created_at))

      const showTail =
        !nextMessage ||
        nextMessage.sender_id !== message.sender_id ||
        new Date(nextMessage.created_at).getTime() - new Date(message.created_at).getTime() >
        5 * 60 * 1000 ||
        !isSameDay(new Date(nextMessage.created_at), new Date(message.created_at))

      const showDateSeparator =
        !previousMessage ||
        !isSameDay(new Date(previousMessage.created_at), new Date(message.created_at))

      return { message, showHeader, showTail, showDateSeparator }
    })
  }, [messages])

  // Virtualizer setup
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 100,
    overscan: 10,
    getItemKey: useCallback((index: number) => items[index].message.id, [items]),
  })

  // Infinite scroll trigger
  useEffect(() => {
    if (!hasMore || isLoadingMore || !onFetchMore) return

    const scrollElement = scrollRef.current
    if (!scrollElement) return

    const handleScroll = () => {
      if (scrollElement.scrollTop < 100 && !isLoadingMore) {
        onFetchMore()
      }
    }

    scrollElement.addEventListener('scroll', handleScroll)
    return () => scrollElement.removeEventListener('scroll', handleScroll)
  }, [hasMore, isLoadingMore, onFetchMore])

  // Scroll position management
  useEffect(() => {
    const viewport = scrollRef.current
    if (!viewport) return

    const handleScrollStatus = () => {
      const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
      const atBottom = distanceFromBottom < 50
      setIsAtBottom(atBottom)
      if (atBottom) setShowJumpToLatest(false)
    }

    viewport.addEventListener('scroll', handleScrollStatus)
    return () => viewport.removeEventListener('scroll', handleScrollStatus)
  }, [])

  // Handle new messages and auto-scroll
  useEffect(() => {
    const hasNewMessages = messages.length > previousCountRef.current
    previousCountRef.current = messages.length

    if (hasNewMessages) {
      if (isAtBottom) {
        requestAnimationFrame(() => {
          virtualizer.scrollToIndex(items.length - 1, { behavior: 'smooth' })
        })
      } else {
        setShowJumpToLatest(true)
      }
    }
  }, [messages.length, isAtBottom, virtualizer, items.length])

  const scrollToBottom = useCallback(() => {
    virtualizer.scrollToIndex(items.length - 1, { behavior: 'smooth' })
    setShowJumpToLatest(false)
  }, [virtualizer, items.length])

  if (messages.length === 0) {
    return (
      <div className="relative flex flex-1 items-center justify-center px-6 py-10">
        <div className="mx-auto flex max-w-[340px] flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[var(--radius-xl)] bg-[#242526] text-white/40 shadow-xl">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="font-display text-lg font-bold text-white">Secure Channel</h2>
          <p className="mt-2 text-[12px] text-[var(--text-secondary)]">
            Messages are end-to-end encrypted. Standard room rules apply.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-0 flex-1 bg-black">
      <div
        ref={scrollRef}
        className="h-full w-full overflow-y-auto overflow-x-hidden scroll-smooth"
        style={{ scrollbarGutter: 'stable' }}
      >
        <div
          className="relative w-full"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {/* Header & Encryption Notice (Fixed at the very top of the virtual space) */}
          <div className="absolute top-0 left-0 w-full flex flex-col items-center pt-8 pb-4 pointer-events-none">
             <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/30 uppercase tracking-[0.1em]">
              <Lock className="h-3 w-3" strokeWidth={3} />
              <span>Secure Channel</span>
            </div>
          </div>

          {virtualizer.getVirtualItems().map((virtualItem) => {
            const { message, showHeader, showTail, showDateSeparator } = items[virtualItem.index]
            
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="mx-auto w-full max-w-[960px] px-4 md:px-0">
                  {showDateSeparator && (
                    <div className="my-6 flex justify-center">
                      <span className="text-[11px] font-bold text-white/25 uppercase tracking-widest">
                        {format(new Date(message.created_at), 'EEEE, MMM d')}
                      </span>
                    </div>
                  )}
                  
                  {virtualItem.index === 0 && isLoadingMore && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
                    </div>
                  )}

                  <MessageItem
                    message={message}
                    isOwn={message.sender_id === user?.id}
                    showHeader={showHeader}
                    showTail={showTail}
                    onToggleReaction={(emoji) => onToggleReaction(message.id, emoji)}
                    onReply={onReply}
                    onTogglePin={onTogglePin}
                    onEditMessage={onEditMessage}
                    onDeleteMessage={onDeleteMessage}
                  />
                  <div className="h-1" /> {/* Spacing between messages */}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showJumpToLatest && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
          <button
            type="button"
            onClick={scrollToBottom}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] glass-panel-heavy px-4 py-2 text-[11px] font-semibold text-[var(--text-primary)] shadow-[var(--shadow-md)] hover:bg-[var(--bg-hover)] transition"
          >
            <ArrowDown className="h-3 w-3 text-[var(--accent)]" strokeWidth={2} />
            New messages
          </button>
        </div>
      )}
    </div>
  )
}
