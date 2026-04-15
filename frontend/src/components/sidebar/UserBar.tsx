
import { useAuth } from '@/hooks/useAuth'
import { useAppShell } from '@/components/app-shell/AppShellContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { LogOut, Settings } from 'lucide-react'

export default function UserBar() {
  const { profile, signOut } = useAuth()
  const { openSettings } = useAppShell()

  if (!profile) return null

  return (
    <div className="border-t border-[var(--border-subtle)] px-3 pb-3 pt-2">
      <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.015)] px-3 py-2.5 shadow-[var(--shadow-xs)]">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="relative">
            <Avatar className="h-8 w-8 border border-[var(--border-default)]">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-[var(--accent)] to-indigo-600 text-[11px] font-bold text-white">
                {profile.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Online pulse */}
            <span
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--bg-surface)] bg-[var(--online)]"
              style={{ animation: 'pulse-online 2s ease-in-out infinite' }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-[var(--text-primary)]">
              {profile.name}
            </p>
            <p className="truncate text-[10px] capitalize text-[var(--text-muted)]">
              {profile.role}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            onClick={openSettings}
            aria-label="Open settings"
          >
            <Settings className="h-3.5 w-3.5" strokeWidth={1.7} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-[var(--radius-sm)] text-[var(--danger)] hover:bg-[rgba(240,106,106,0.08)] hover:text-[#ff8c8c]"
            onClick={signOut}
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.7} />
          </Button>
        </div>
      </div>
    </div>
  )
}
