
import RoomList from './RoomList'
import UserBar from './UserBar'
import { ChevronDown, GraduationCap, Search, X } from 'lucide-react'
import { useAppShell } from '@/components/app-shell/AppShellContext'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Sidebar() {
  const { searchQuery, setSearchQuery } = useAppShell()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA' && (e.target as HTMLElement).getAttribute('contenteditable') !== 'true') {
        e.preventDefault()
        document.getElementById('room-search-input')?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex h-full flex-col bg-[var(--bg-surface)] text-[var(--text-primary)]">
      <div className="flex h-[52px] items-center px-4">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-[var(--border-default)] bg-[linear-gradient(180deg,rgba(79,142,247,0.22),rgba(79,142,247,0.06))] text-[var(--accent)] shadow-[var(--shadow-sm)]">
            <GraduationCap className="h-[18px] w-[18px]" strokeWidth={1.7} />
          </div>
          <div className="min-w-0">
            <div className="font-display text-[15px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
              CampusChat
            </div>
            <div className="text-[11px] font-medium text-[var(--text-muted)]">
              Workspace messaging
            </div>
          </div>
        </Link>
      </div>

      <div className="px-3 pb-3 pt-2">
        <button
          type="button"
          className="flex h-10 w-full items-center justify-between rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-left shadow-[var(--shadow-sm)] hover:bg-[var(--bg-hover)]"
        >
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
              Engineering Workspace
            </div>
            <div className="truncate text-[11px] text-[var(--text-secondary)]">
              Product design sync
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
        </button>
      </div>

      <div className="px-3 pb-2 pt-1">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)] transition-colors group-focus-within:text-[var(--accent)]" strokeWidth={1.8} />
          <input
            id="room-search-input"
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] pl-9 pr-9 text-[13px] font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        <RoomList />
      </div>

      <UserBar />
    </div>
  )
}
