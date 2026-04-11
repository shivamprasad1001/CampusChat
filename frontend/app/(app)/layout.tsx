'use client'

import { useAuth } from '@/hooks/useAuth'
import Sidebar from '@/components/sidebar/Sidebar'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AppShellProvider, useAppShell } from '@/components/app-shell/AppShellContext'
import { PanelLeftClose } from 'lucide-react'

function AppShellFrame({ children }: { children: React.ReactNode }) {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useAppShell()

  return (
    <div className="app-shell flex h-screen overflow-hidden text-[var(--text-primary)]">
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-[4px] transition-opacity md:hidden ${
          mobileSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] max-w-[88vw] transform border-r border-[var(--border-subtle)] bg-[rgba(19,22,27,0.96)] shadow-[var(--shadow-lg)] backdrop-blur-xl transition-transform md:static md:z-auto md:w-[240px] md:translate-x-0 md:border-r ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-end px-4 pt-4 md:hidden">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              aria-label="Close sidebar"
            >
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
          <Sidebar />
        </div>
      </aside>

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}

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
      <div className="app-shell flex min-h-screen items-center justify-center">
        <div className="elevated-panel flex min-w-[220px] items-center gap-3 rounded-[14px] px-5 py-4 text-[var(--text-secondary)]">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--accent)]" />
          <span className="font-medium">Loading your workspace…</span>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <AppShellProvider>
      <AppShellFrame>{children}</AppShellFrame>
    </AppShellProvider>
  )
}
