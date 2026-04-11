'use client'

import RoomList from './RoomList'
import UserBar from './UserBar'
import { ChevronDown, Command, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export default function Sidebar() {
  return (
    <div className="flex h-full flex-col bg-[var(--bg-surface)] text-[var(--text-primary)]">
      <div className="flex h-[52px] items-center px-4">
        <Link href="/" className="flex min-w-0 items-center gap-3">
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

      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-[12px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-[11px] text-[var(--text-secondary)]">
          <Command className="h-3.5 w-3.5 text-[var(--accent)]" strokeWidth={1.8} />
          <span>Press `/` for quick actions</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        <RoomList />
      </div>

      <UserBar />
    </div>
  )
}
