
import { createContext, useContext, useMemo, useState } from 'react'

interface AppShellContextValue {
  mobileSidebarOpen: boolean
  membersPanelOpen: boolean
  setMobileSidebarOpen: (open: boolean) => void
  setMembersPanelOpen: (open: boolean) => void
  toggleMobileSidebar: () => void
  toggleMembersPanel: () => void
}

const AppShellContext = createContext<AppShellContextValue | null>(null)

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [membersPanelOpen, setMembersPanelOpen] = useState(false)

  const value = useMemo(
    () => ({
      mobileSidebarOpen,
      membersPanelOpen,
      setMobileSidebarOpen,
      setMembersPanelOpen,
      toggleMobileSidebar: () => setMobileSidebarOpen((open) => !open),
      toggleMembersPanel: () => setMembersPanelOpen((open) => !open),
    }),
    [membersPanelOpen, mobileSidebarOpen]
  )

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>
}

export function useAppShell() {
  const context = useContext(AppShellContext)

  if (!context) {
    throw new Error('useAppShell must be used within an AppShellProvider')
  }

  return context
}
