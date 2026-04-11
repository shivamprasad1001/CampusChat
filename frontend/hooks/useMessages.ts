'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import api from '@/lib/api'
import { Message } from '@/types'
import { io, Socket } from 'socket.io-client'

export function useMessages(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [typingUsers, setTypingUsers] = useState<{ userId: string, name: string }[]>([])

  useEffect(() => {
    // 1. Fetch history
    const fetchHistory = async () => {
      try {
        const { data } = await api.get(`/messages/${roomId}`)
        setMessages(data)
      } catch (err) {
        console.error('Failed to fetch messages', err)
      }
    }
    fetchHistory()

    // 2. Setup Socket.IO
    const s = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000')
    setSocket(s)

    s.emit('join_room', { roomId })

    s.on('new_message', (message: Message) => {
      setMessages((prev) => [...prev, message])
    })

    s.on('user_typing', ({ userId, name }) => {
      setTypingUsers((prev) => {
        if (prev.find(u => u.userId === userId)) return prev
        return [...prev, { userId, name }]
      })
      
      // Remove typing indicator after 3 seconds
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter(u => u.userId !== userId))
      }, 3000)
    })

    s.on('reaction_update', ({ messageId, reactions }) => {
      setMessages((prev) => prev.map(m => 
        m.id === messageId ? { ...m, reactions } : m
      ))
    })

    // 3. Supabase Realtime Fallback/Extra
    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        // If Socket.IO miss it, we add it (check by id)
        const newMessage = payload.new as Message
        setMessages((prev) => {
          if (prev.find(m => m.id === newMessage.id)) return prev
          return [...prev, newMessage]
        })
      })
      .subscribe()

    return () => {
      s.disconnect()
      supabase.removeChannel(channel)
    }
  }, [roomId])

  const sendMessage = useCallback((content: string, fileUrl?: string, userId?: string) => {
    if (socket) {
      socket.emit('send_message', { roomId, content, fileUrl, userId })
    }
  }, [socket, roomId])

  const sendTyping = useCallback((userId: string, name: string) => {
    if (socket) {
      socket.emit('typing', { roomId, userId, name })
    }
  }, [socket, roomId])

  const toggleReaction = useCallback((messageId: string, emoji: string, userId: string) => {
    if (socket) {
      socket.emit('toggle_reaction', { roomId, messageId, emoji, userId })
    }
  }, [socket, roomId])

  return { messages, sendMessage, sendTyping, toggleReaction, typingUsers }
}
