'use client'

import { Profile } from '@/types'
import { cn } from '@/lib/utils'

interface RoomMembersPanelProps {
  members: Array<Partial<Profile> & { id: string; isOnline?: boolean }>
  open: boolean
}

export default function RoomMembersPanel({
  members,
  open,
}: RoomMembersPanelProps) {
  const onlineMembers = members.filter((member) => member.isOnline)
  const offlineMembers = members.filter((member) => !member.isOnline)

  return (
    <aside
      className={cn(
        'border-l border-[var(--border-subtle)] bg-[rgba(19,22,27,0.88)] backdrop-blur-xl transition-all',
        open
          ? 'fixed inset-y-0 right-0 z-40 flex w-[280px] max-w-[86vw] shadow-[var(--shadow-lg)] xl:static xl:z-auto xl:shadow-none'
          : 'hidden xl:flex xl:w-[280px] xl:shrink-0'
      )}
    >
      <div className="flex min-h-0 w-full flex-col">
        <div className="flex h-[52px] items-center border-b border-[var(--border-subtle)] px-4">
          <div>
            <h2 className="font-display text-[15px] font-semibold text-[var(--text-primary)]">
              People
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)]">
              {members.length} collaborators in this room
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <MemberSection title="Online" members={onlineMembers} />
          <MemberSection title="Offline" members={offlineMembers} />
        </div>
      </div>
    </aside>
  )
}

function MemberSection({
  title,
  members,
}: {
  title: string
  members: Array<Partial<Profile> & { id: string; isOnline?: boolean }>
}) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        {title}
      </h3>

      <div className="space-y-1">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex h-9 items-center gap-3 rounded-[10px] px-2 hover:bg-[var(--bg-hover)]"
          >
            <div
              className="relative flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white"
              style={{ background: createAvatarGradient(member.name || 'U') }}
            >
              {getInitials(member.name || 'U')}
              <span
                className={cn(
                  'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg-surface)]',
                  member.isOnline ? 'bg-[var(--online)]' : 'bg-[var(--text-muted)]'
                )}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-[var(--text-primary)]">
                {member.name || 'Unknown user'}
              </div>
            </div>

            <span className="rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-secondary)]">
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
  return `linear-gradient(180deg, hsl(${hue} 70% 58%), hsl(${(hue + 24) % 360} 56% 44%))`
}
