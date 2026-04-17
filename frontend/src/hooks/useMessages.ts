
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import api from '@/lib/api'
import { Message } from '@/types'
import { getSocket } from '@/lib/socket'
import { Socket } from 'socket.io-client'
import { RealtimePostgresInsertPayload } from '@supabase/supabase-js'
import { useAuth } from '@/hooks/useAuth'

export function useMessages(roomId: string) {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Instant Loading: Initialize from cache
    try {
      const cached = localStorage.getItem(`chat_history_${roomId}`)
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })

  const [typingUsers, setTypingUsers] = useState<{ userId: string, name: string }[]>([])
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    // 1. Fetch history
    const fetchHistory = async () => {
      try {
        setHasMore(true)
        const { data } = await api.get(`/messages/${roomId}?limit=50`)
        setMessages(data)
        if (data.length < 50) setHasMore(false)
        
        // Cache the latest 50 messages for instant refresh next time
        localStorage.setItem(`chat_history_${roomId}`, JSON.stringify(data))
      } catch (err) {
        console.error('Failed to fetch messages', err)
      }
    }
    fetchHistory()

    // 2. Setup Socket.IO
    const s = getSocket(user?.id)
    socketRef.current = s

    const onConnect = () => {
      console.log('[Socket] Reconnected, re-joining room:', roomId)
      s.emit('join_room', { roomId, userId: user?.id })
    }

    s.on('connect', onConnect)
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

    s.on('message_edited', (editedMessage: Message) => {
      setMessages((prev) => prev.map(m => 
        m.id === editedMessage.id ? editedMessage : m
      ))
    })

    s.on('message_deleted', ({ messageId }) => {
      setMessages((prev) => prev.map(m => 
        m.id === messageId ? { ...m, is_deleted: true, content: undefined, file_url: undefined } : m
      ))
    })

    s.on('reply_added', ({ parentId, newCount }) => {
      setMessages((prev) => prev.map(m => 
        m.id === parentId ? { ...m, reply_count: newCount } : m
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
      }, (payload: RealtimePostgresInsertPayload<Record<string, unknown>>) => {
        const newMessage = payload.new as unknown as Message
        setMessages((prev) => {
          if (prev.find(m => m.id === newMessage.id)) return prev
          return [...prev, newMessage]
        })
      })
      .subscribe()

    return () => {
      s.off('connect', onConnect)
      s.off('new_message')
      s.off('room_users')
      s.off('message_pinned')
      s.off('user_typing')
      s.off('reaction_update')
      s.off('message_edited')
      s.off('message_deleted')
      s.off('reply_added')
      
      socketRef.current = null
      supabase.removeChannel(channel)
    }
  }, [roomId, user?.id])

  const sendMessage = useCallback((content: string, fileUrl?: string, userId?: string, parentId?: string, fileType?: string, duration?: number) => {
    if (socketRef.current) {
      socketRef.current.emit('send_message', { roomId, content, fileUrl, userId, parentId, fileType, duration })
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

  const editMessage = useCallback((messageId: string, content: string, userId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('edit_message', { roomId, messageId, content, userId })
    }
  }, [roomId])

  const deleteMessage = useCallback((messageId: string, userId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('delete_message', { roomId, messageId, userId })
    }
  }, [roomId])

  const fetchMoreMessages = useCallback(async () => {
    if (!hasMore || isLoadingMore || messages.length === 0) return;
    setIsLoadingMore(true);
    try {
      const oldestMessage = messages[0];
      const { data } = await api.get(`/messages/${roomId}?limit=50&before=${encodeURIComponent(oldestMessage.created_at)}`);
      if (data.length < 50) setHasMore(false);
      
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMessages = data.filter((m: Message) => !existingIds.has(m.id));
        return [...newMessages, ...prev];
      });
    } catch (err) {
      console.error('Failed to fetch more messages', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, messages, roomId]);

  return { messages, sendMessage, sendTyping, toggleReaction, togglePin, editMessage, deleteMessage, fetchMoreMessages, hasMore, isLoadingMore, typingUsers, onlineUserIds }
}
