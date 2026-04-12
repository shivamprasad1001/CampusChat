'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import api from '@/lib/api'
import { Message } from '@/types'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/hooks/useAuth'

export function useMessages(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<{ userId: string, name: string }[]>([])
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([])
  const socketRef = useRef<Socket | null>(null)
  const { user } = useAuth()

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
    socketRef.current = s

    s.emit('join_room', { roomId, userId: user?.id })

    s.on('new_message', (message: Message) => {
      setMessages((prev) => [...prev, message])
    })

    s.on('room_users', (userIds: string[]) => {
      setOnlineUserIds(userIds)
    })

    s.on('message_pinned', ({ messageId, isPinned }) => {
      setMessages((prev) => prev.map(m => 
        m.id === messageId ? { ...m, is_pinned: isPinned } : m
      ))
    })

    s.on('user_typing', ({ userId, name }) => {
      setTypingUsers((prev) => {
        if (prev.find(u => u.userId === userId)) return prev
        return [...prev, { userId, name }]
      })
      
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter(u => u.userId !== userId))
      }, 2000)
    })

    s.on('reaction_update', ({ messageId, reactions }) => {
      setMessages((prev) => prev.map(m => 
        m.id === messageId ? { ...m, reactions } : m
      ))
    })

    // 3. Supabase Realtime Fallback
    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        const newMessage = payload.new as Message
        setMessages((prev) => {
          if (prev.find(m => m.id === newMessage.id)) return prev
          return [...prev, newMessage]
        })
      })
      .subscribe()

    return () => {
      s.disconnect()
      socketRef.current = null
      supabase.removeChannel(channel)
    }
  }, [roomId, user?.id])

  const sendMessage = useCallback((content: string, fileUrl?: string, userId?: string, parentId?: string) => {
    if (socketRef.current) {
      socketRef.current.emit('send_message', { roomId, content, fileUrl, userId, parentId })
    }
  }, [roomId])

  const sendTyping = useCallback((userId: string, name: string) => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { roomId, userId, name })
    }
  }, [roomId])

  const toggleReaction = useCallback((messageId: string, emoji: string, userId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('toggle_reaction', { roomId, messageId, emoji, userId })
    }
  }, [roomId])

  const togglePin = useCallback((messageId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('toggle_pin', { roomId, messageId })
    }
  }, [roomId])

  return { messages, sendMessage, sendTyping, toggleReaction, togglePin, typingUsers, onlineUserIds }
}
