
import { useAuth } from '@/hooks/useAuth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { LogOut, Settings } from 'lucide-react'

export default function UserBar() {
  const { profile, signOut } = useAuth()

  if (!profile) return null

  return (
    <div className="border-t border-[var(--border-subtle)] px-3 pb-3 pt-2">
      <div className="flex items-center justify-between rounded-[14px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)] px-3 py-3 shadow-[var(--shadow-sm)]">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-9 w-9 border border-[var(--border-default)]">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="bg-[linear-gradient(180deg,rgba(79,142,247,0.92),rgba(79,142,247,0.55))] text-white">
              {profile.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
              {profile.name}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
              <span className="inline-flex h-2 w-2 rounded-full bg-[var(--online)]" />
              <span className="truncate capitalize">{profile.role}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-[10px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <Settings className="h-4 w-4" strokeWidth={1.6} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-[10px] text-[var(--danger)] hover:bg-[rgba(240,106,106,0.08)] hover:text-[#ff8c8c]"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" strokeWidth={1.6} />
          </Button>
        </div>
      </div>
    </div>
  )
}
