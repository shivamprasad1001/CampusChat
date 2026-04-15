
import { createContext, useContext, useMemo, useState } from 'react'

interface AppShellContextValue {
  mobileSidebarOpen: boolean
  membersPanelOpen: boolean
  settingsOpen: boolean
  setMobileSidebarOpen: (open: boolean) => void
  setMembersPanelOpen: (open: boolean) => void
  toggleMobileSidebar: () => void
  toggleMembersPanel: () => void
  openSettings: () => void
  closeSettings: () => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  focusSearch: () => void
}

const AppShellContext = createContext<AppShellContextValue | null>(null)

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [membersPanelOpen, setMembersPanelOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const focusSearch = () => {
    const input = document.getElementById('room-search-input') as HTMLInputElement
    if (input) {
      input.focus()
    }
  }

  const value = useMemo(
    () => ({
      mobileSidebarOpen,
      membersPanelOpen,
      settingsOpen,
      setMobileSidebarOpen,
      setMembersPanelOpen,
      toggleMobileSidebar: () => setMobileSidebarOpen((open) => !open),
      toggleMembersPanel: () => setMembersPanelOpen((open) => !open),
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
      searchQuery,
      setSearchQuery,
      focusSearch,
    }),
    [membersPanelOpen, mobileSidebarOpen, settingsOpen, searchQuery]
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
