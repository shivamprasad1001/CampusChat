'use client'

import { useAuth } from '@/hooks/useAuth'
import Sidebar from '@/components/sidebar/Sidebar'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push('/login')
    } else if (!profile || !profile.department || !profile.year) {
      router.push('/onboarding')
    }
  }, [user, profile, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <aside className="w-72 flex-shrink-0">
        <Sidebar />
      </aside>
      <main className="flex-1 relative flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
