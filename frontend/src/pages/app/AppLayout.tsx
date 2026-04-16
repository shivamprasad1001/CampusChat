import { useAuth } from '@/hooks/useAuth'
import Sidebar from '@/components/sidebar/Sidebar'
import UserSettingsModal from '@/components/settings/UserSettingsModal'
import { useNavigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AppShellProvider, useAppShell } from '@/components/app-shell/AppShellContext'
import { PanelLeftClose } from 'lucide-react'
import { cn } from '@/lib/utils'
import ThreadPanel from '@/components/chat/ThreadPanel'

function AppShellFrame() {
  const { mobileSidebarOpen, setMobileSidebarOpen, settingsOpen, closeSettings, threadPanelOpen } = useAppShell()

  return (
    <div className="app-shell flex h-[100dvh] overflow-hidden text-[var(--text-primary)]">
      {/* Mobile sidebar backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-[6px] transition-opacity duration-300 md:hidden",
          mobileSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setMobileSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[272px] max-w-[88vw] transform border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-xl)] transition-transform duration-300 ease-[var(--ease-spring)] md:static md:z-auto md:w-[248px] md:translate-x-0 md:shadow-none",
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Mobile close button */}
          <div className="flex items-center justify-end px-4 pt-4 md:hidden">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              aria-label="Close sidebar"
            >
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
          <Sidebar />
        </div>
      </aside>

      {/* Main content + Thread panel */}
      <div className="flex flex-1 overflow-hidden">
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </main>
        
        {threadPanelOpen && <ThreadPanel />}
      </div>

      {/* Settings Modal */}
      <UserSettingsModal open={settingsOpen} onClose={closeSettings} />
    </div>
  )
}

export default function AppLayout() {
  const { user, profile, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const [showRecovery, setShowRecovery] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (loading) {
      timer = setTimeout(() => setShowRecovery(true), 5000)
    } else {
      setShowRecovery(false)
    }
    return () => clearTimeout(timer)
  }, [loading])

  useEffect(() => {
    if (loading) return

    if (!user) {
      navigate('/login')
    } else if (!profile || !profile.department || profile.year === undefined || profile.year === null) {
      navigate('/onboarding')
    }
  }, [user, profile, loading, navigate])

  if (loading) {
    return (
      <div className="app-shell flex min-h-[100dvh] flex-col items-center justify-center gap-6 p-6">
        <div className="glass-panel flex min-w-[240px] items-center gap-3 rounded-[var(--radius-lg)] px-5 py-4 text-[var(--text-secondary)] shadow-[var(--shadow-lg)]">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--accent)]" />
          <span className="font-medium">Loading your workspace…</span>
        </div>

        {showRecovery && (
          <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col items-center gap-3 text-center duration-700">
            <p className="max-w-[280px] text-[12px] text-[var(--text-muted)]">
              This is taking longer than usual. There might be a connection issue or a stale session.
            </p>
            <button
              onClick={() => signOut()}
              className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2 text-[12px] font-semibold text-[var(--text-primary)] transition-all hover:bg-[var(--bg-hover)] active:scale-95"
            >
              Reset Session & Sign Out
            </button>
          </div>
        )}
      </div>
    )
  }

  if (!user) return null

  return (
    <AppShellProvider>
      <AppShellFrame />
    </AppShellProvider>
  )
}
