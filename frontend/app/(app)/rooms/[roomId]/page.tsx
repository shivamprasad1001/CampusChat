'use client'

import { useParams } from 'next/navigation'
import { useMessages } from '@/hooks/useMessages'
import { useAuth } from '@/hooks/useAuth'
import MessageList from '@/components/chat/MessageList'
import MessageInput from '@/components/chat/MessageInput'
import { Hash, Info } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Room } from '@/types'

export default function RoomPage() {
  const { roomId } = useParams()
  const { user, profile } = useAuth()
  const { messages, sendMessage, sendTyping, toggleReaction, typingUsers } = useMessages(roomId as string)
  const [room, setRoom] = useState<Room | null>(null)

  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const { data } = await api.get(`/rooms`)
        const currentRoom = data.find((r: Room) => r.id === roomId)
        setRoom(currentRoom)
      } catch (err) {
        console.error('Failed to fetch room details', err)
      }
    }
    fetchRoomDetails()
  }, [roomId])

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
    <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 backdrop-blur-md z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Hash className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tight">
              {room.name}
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              {room.description || 'Public channel for discussion'}
            </p>
          </div>
        </div>
        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          <Info className="h-5 w-5" />
        </button>
      </header>

      {/* Message Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-gray-50/30 dark:bg-gray-950/10">
        <MessageList 
          messages={messages} 
          onToggleReaction={(messageId, emoji) => user && toggleReaction(messageId, emoji, user.id)}
        />
        
        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="px-6 py-1 text-xs text-gray-500 italic flex items-center space-x-2 animate-pulse">
            <div className="flex space-x-1">
              <span className="h-1 w-1 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="h-1 w-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="h-1 w-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
            <span>
              {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}
      </div>

      {/* Input */}
      <MessageInput 
        onSendMessage={handleSendMessage} 
        onTyping={handleTyping}
      />
    </div>
  )
}
