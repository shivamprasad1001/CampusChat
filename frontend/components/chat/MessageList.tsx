'use client'

import { useEffect, useRef } from 'react'
import { Message } from '@/types'
import MessageItem from './MessageItem'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/useAuth'

interface MessageListProps {
  messages: Message[]
  onToggleReaction: (messageId: string, emoji: string) => void
}

export default function MessageList({ messages, onToggleReaction }: MessageListProps) {
  const { user } = useAuth()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        // Use a small timeout to ensure DOM has updated
        setTimeout(() => {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth'
          })
        }, 100)
      }
    }
  }, [messages])

  return (
    <ScrollArea ref={scrollRef} className="flex-1 h-full min-h-0">
      <div className="flex flex-col py-6 pb-32 space-y-1">
        {messages.map((message) => (
          <MessageItem 
            key={message.id} 
            message={message} 
            isOwn={message.sender_id === user?.id} 
            onToggleReaction={(emoji) => onToggleReaction(message.id, emoji)}
          />
        ))}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 py-12">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
