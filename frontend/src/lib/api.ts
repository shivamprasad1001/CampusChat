import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor to add auth token
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// Interceptor to handle 401 Unauthorized errors (Task 4)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('[API] Received 401 Unauthorized. Clearing session and redirecting...')
      
      // Clear Supabase session
      await supabase.auth.signOut()
      
      // Redirect to login if on protected route
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
        window.location.href = '/login?error=session_expired'
      }
    }
    return Promise.reject(error)
  }
)

export default api
