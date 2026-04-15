
import RoomList from './RoomList'
import UserBar from './UserBar'
import { GraduationCap, Search, X } from 'lucide-react'
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
      {/* macOS-style Title Bar */}
      <div className="flex h-[52px] items-center gap-3 px-4">
        {/* Traffic light dots (decorative) */}
        <div className="hidden items-center gap-[6px] md:flex" aria-hidden="true">
          <span className="h-[10px] w-[10px] rounded-full bg-[var(--traffic-red)] opacity-80 shadow-[inset_0_-1px_1px_rgba(0,0,0,0.2)]" />
          <span className="h-[10px] w-[10px] rounded-full bg-[var(--traffic-yellow)] opacity-80 shadow-[inset_0_-1px_1px_rgba(0,0,0,0.2)]" />
          <span className="h-[10px] w-[10px] rounded-full bg-[var(--traffic-green)] opacity-80 shadow-[inset_0_-1px_1px_rgba(0,0,0,0.2)]" />
        </div>

        <Link to="/" className="flex min-w-0 items-center gap-2.5 ml-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-gradient-to-b from-[rgba(91,154,255,0.2)] to-[rgba(91,154,255,0.06)] text-[var(--accent)] shadow-[var(--shadow-xs)]">
            <GraduationCap className="h-[16px] w-[16px]" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <div className="font-display text-[14px] font-bold tracking-tight text-[var(--text-primary)]">
              CampusChat
            </div>
            <div className="text-[10px] font-medium text-[var(--text-muted)]">
              Workspace
            </div>
          </div>
        </Link>
      </div>

      {/* Search */}
      <div className="px-3 pb-2 pt-1">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)] transition-colors group-focus-within:text-[var(--accent)]" strokeWidth={2} />
          <input
            id="room-search-input"
            type="text"
            placeholder="Search rooms…  /"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] pl-8 pr-8 text-[12px] font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-muted)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Room List */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        <RoomList />
      </div>

      {/* User Bar */}
      <UserBar />
    </div>
  )
}
