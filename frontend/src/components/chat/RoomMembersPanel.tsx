
import { Profile } from '@/types'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useAppShell } from '@/components/app-shell/AppShellContext'

interface RoomMembersPanelProps {
  members: Array<Partial<Profile> & { id: string; isOnline?: boolean }>
  open: boolean
}

export default function RoomMembersPanel({
  members,
  open,
}: RoomMembersPanelProps) {
  const { toggleMembersPanel } = useAppShell()
  const onlineMembers = members.filter((member) => member.isOnline)
  const offlineMembers = members.filter((member) => !member.isOnline)

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[4px] xl:hidden"
          onClick={toggleMembersPanel}
        />
      )}

      <aside
        className={cn(
          'border-l border-[var(--border-subtle)] transition-all duration-300 ease-[var(--ease-spring)]',
          // Mobile: slide from right
          open
            ? 'fixed inset-y-0 right-0 z-50 flex w-[280px] max-w-[86vw] glass-panel-heavy shadow-[var(--shadow-xl)] xl:static xl:z-auto xl:bg-[var(--bg-surface)] xl:shadow-none xl:backdrop-blur-none'
            : 'hidden xl:flex xl:w-[260px] xl:shrink-0',
          // Animation
          open && 'animate-[slide-in-right_300ms_var(--ease-spring)]'
        )}
      >
        <div className="flex min-h-0 w-full flex-col">
          {/* Header */}
          <div className="flex h-[52px] items-center justify-between border-b border-[var(--border-subtle)] px-4">
            <div>
              <h2 className="font-display text-[13px] font-bold text-[var(--text-primary)]">
                People
              </h2>
              <p className="text-[10px] text-[var(--text-muted)]">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={toggleMembersPanel}
              className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] xl:hidden"
              aria-label="Close members panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <MemberSection title="Online" members={onlineMembers} count={onlineMembers.length} />
            <MemberSection title="Offline" members={offlineMembers} count={offlineMembers.length} />
          </div>
        </div>
      </aside>
    </>
  )
}

function MemberSection({
  title,
  members,
  count,
}: {
  title: string
  members: Array<Partial<Profile> & { id: string; isOnline?: boolean }>
  count: number
}) {
  return (
    <section className="mb-4">
      <h3 className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        {title} — {count}
      </h3>

      <div className="space-y-0.5">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex h-9 items-center gap-2.5 rounded-[var(--radius-sm)] px-2 transition-colors hover:bg-[var(--bg-hover)]"
          >
            <div
              className="relative flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-[var(--shadow-xs)]"
              style={{ background: createAvatarGradient(member.name || 'U') }}
            >
              {getInitials(member.name || 'U')}
              <span
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-[1.5px]',
                  member.isOnline
                    ? 'border-[var(--bg-surface)] bg-[var(--online)]'
                    : 'border-[var(--bg-surface)] bg-[var(--text-muted)]'
                )}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-medium text-[var(--text-primary)]">
                {member.name || 'Unknown user'}
              </div>
            </div>

            <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              {member.role || (member.isOnline ? 'Active' : 'Idle')}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function createAvatarGradient(name: string) {
  let hash = 0

  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash)
  }

  const hue = Math.abs(hash) % 360
  return `linear-gradient(135deg, hsl(${hue} 70% 58%), hsl(${(hue + 24) % 360} 56% 44%))`
}
