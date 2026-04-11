import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor to add auth token
api.interceptors.request.use(async (config) => {
  // We'll get the session from supabase-js
  const { data: { session } } = await (await import('./supabase')).supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

export default api
