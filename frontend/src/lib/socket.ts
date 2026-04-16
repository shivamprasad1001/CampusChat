import { io, Socket } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

let socket: Socket | null = null

export const getSocket = (userId?: string): Socket => {
  if (!socket) {
    socket = io(BACKEND_URL, {
      autoConnect: true,
      query: userId ? { userId } : {}
    })
    
    socket.on('connect', () => {
      console.log('[Socket] Connected to backend')
    })
    
    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected')
    })
  } else if (userId && (socket.io.opts.query as any)?.userId !== userId) {
    // Update userId if it has changed (e.g. after login)
    socket.io.opts.query = { userId }
    if (socket.connected) {
      socket.disconnect().connect()
    }
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
