'use client'

import { Fragment, ReactNode } from 'react'
import { Message } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Copy,
  CornerUpLeft,
  MoreHorizontal,
  Pin,
  SmilePlus,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'

interface MessageItemProps {
  message: Message
  isOwn: boolean
  onToggleReaction: (emoji: string) => void
  onReply: (message: Message) => void
  onTogglePin: (messageId: string) => void
  showHeader: boolean
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥']

export default function MessageItem({
  message,
  isOwn,
  onToggleReaction,
  onReply,
  onTogglePin,
  showHeader,
}: MessageItemProps) {
  const { user } = useAuth()
  const profile = message.profiles || {}
  const displayName = profile.name || (isOwn ? 'You' : 'Unknown user')
  const reactionsMap = (message.reactions || []).reduce(
    (acc, reaction) => {
      acc[reaction.emoji] = acc[reaction.emoji] || []
      acc[reaction.emoji].push(reaction.user_id)
      return acc
    },
    {} as Record<string, string[]>
  )

  return (
    <article
      className={cn(
        'group/message relative mx-2 rounded-[14px] px-3 py-2 text-[13px] transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[rgba(31,36,45,0.72)]',
        !showHeader && 'pt-1',
        isOwn && 'flex-row-reverse'
      )}
      style={{ animation: 'chat-enter 200ms cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      <div className={cn(
        'pointer-events-none absolute top-2 hidden text-[11px] text-[var(--text-muted)] group-hover/message:block md:block md:opacity-0 md:group-hover/message:opacity-100',
        isOwn ? 'left-3' : 'right-3'
      )}>
        <time
          dateTime={message.created_at}
          aria-label={format(new Date(message.created_at), 'PPpp')}
        >
          {format(new Date(message.created_at), 'p')}
        </time>
      </div>

      <div className={cn('flex gap-3', isOwn && 'flex-row-reverse')}>
        <div className="w-8 shrink-0">
          {showHeader ? (
            <Avatar className="h-8 w-8 border border-[var(--border-default)]">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback
                className="text-[11px] font-semibold text-white"
                style={{ background: createAvatarGradient(displayName) }}
              >
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-8" aria-hidden="true" />
          )}
        </div>

        <div className={cn('min-w-0 flex-1', isOwn && 'flex flex-col items-end')}>
          {showHeader && (
            <div className={cn('mb-1.5 flex items-center gap-2', isOwn ? 'flex-row-reverse pr-0 pl-20' : 'pr-20')}>
              <span className="font-semibold text-[var(--text-primary)]">{displayName}</span>
              <time
                className="text-[11px] text-[var(--text-secondary)]"
                dateTime={message.created_at}
                aria-label={format(new Date(message.created_at), 'PPpp')}
              >
                {format(new Date(message.created_at), 'MMM d, p')}
              </time>
              {message.is_pinned && (
                <div className="flex items-center gap-1 text-[10px] font-medium text-[var(--accent)]">
                  <Pin className="h-3 w-3 rotate-45" />
                  <span>Pinned</span>
                </div>
              )}
            </div>
          )}

          {/* Reply Preview */}
          {message.parent && (
            <div className={cn(
              'mb-1 inline-flex max-w-[400px] items-center gap-2 rounded-[8px] border-l-2 border-[var(--accent)] bg-[rgba(255,255,255,0.03)] py-1.5 pl-3 pr-4 text-[12px] text-[var(--text-secondary)]',
              isOwn && 'flex-row-reverse border-l-0 border-r-2 text-right'
            )}>
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold text-[var(--accent)]">
                  {message.parent.profiles?.name || 'User'}
                </span>
                <span className="block truncate opacity-80">{message.parent.content}</span>
              </div>
            </div>
          )}

          <div
            className={cn(
              'max-w-[min(78ch,100%)] rounded-[12px] border border-transparent px-3 py-2 text-[13px] leading-[1.65] text-[var(--text-primary)] shadow-sm',
              isOwn 
                ? 'bg-[var(--accent)] bg-opacity-10 border-[var(--accent)] border-opacity-20 text-right' 
                : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)]',
              message.file_url || containsCodeBlock(message.content || '')
                ? 'bg-opacity-20'
                : '',
              !showHeader && (isOwn ? 'pr-0.5' : 'pl-0.5')
            )}
          >
            {message.content ? (
              <MessageContent content={message.content} />
            ) : (
              <p className="text-[var(--text-secondary)]">Shared an attachment</p>
            )}

            {message.file_url && (
              <div className="mt-3 overflow-hidden rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                {message.file_type?.startsWith('image/') ? (
                  <img
                    src={message.file_url}
                    alt="Attachment preview"
                    className="max-h-[340px] w-full object-cover"
                  />
                ) : (
                  <a
                    href={message.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 px-4 py-3 text-[13px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                  >
                    <span className="truncate">Download attachment</span>
                    <span className="text-[11px] text-[var(--accent)]">Open</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {Object.keys(reactionsMap).length > 0 && (
            <div className={cn('mt-2 flex flex-wrap gap-2', isOwn && 'justify-end')}>
              {Object.entries(reactionsMap).map(([emoji, userIds]) => {
                const hasReacted = !!user && userIds.includes(user.id)

                return (
                  <button
                    key={emoji}
                    onClick={() => onToggleReaction(emoji)}
                    className={cn(
                      'inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[11px] text-[var(--text-secondary)] shadow-[var(--shadow-sm)] transition hover:scale-[1.05] hover:bg-[var(--bg-hover)]',
                      hasReacted
                        ? 'border-[var(--accent)] bg-[var(--accent-glow)] text-[var(--text-primary)]'
                        : 'border-[var(--border-default)] bg-[var(--bg-elevated)]'
                    )}
                    style={{ animation: 'reaction-pop 180ms cubic-bezier(0.16, 1, 0.3, 1)' }}
                  >
                    <span>{emoji}</span>
                    <span className="font-semibold">{userIds.length}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className={cn(
        'pointer-events-none absolute top-0 hidden -translate-y-1/2 opacity-0 transition group-hover/message:pointer-events-auto group-hover/message:opacity-100 md:flex',
        isOwn ? 'left-4' : 'right-4'
      )}>
        <div className="flex items-center gap-0.5 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-1 shadow-[var(--shadow-md)]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                aria-label="Add reaction"
              >
                <SmilePlus className="h-4 w-4" strokeWidth={1.6} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isOwn ? 'start' : 'end'} className="bg-[var(--bg-elevated)] border-[var(--border-subtle)] min-w-0">
              <div className="flex gap-1 p-1">
                {COMMON_EMOJIS.map(emoji => (
                  <DropdownMenuItem key={emoji} onClick={() => onToggleReaction(emoji)} className="cursor-pointer p-1.5 text-lg hover:bg-[var(--bg-hover)] rounded-md">
                    {emoji}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <ToolbarButton ariaLabel="Reply to message" onClick={() => onReply(message)}>
            <CornerUpLeft className="h-4 w-4" strokeWidth={1.6} />
          </ToolbarButton>
          
          <ToolbarButton 
            ariaLabel="Pin message" 
            onClick={() => onTogglePin(message.id)}
            className={message.is_pinned ? 'text-[var(--accent)] bg-[var(--accent-glow)]' : ''}
          >
            <Pin className={cn("h-4 w-4", message.is_pinned && "rotate-45")} strokeWidth={1.6} />
          </ToolbarButton>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-4 w-4" strokeWidth={1.6} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isOwn ? 'start' : 'end'}
              className="min-w-[180px] rounded-[10px] border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-lg)]"
            >
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.content || '')} className="cursor-pointer text-[13px]">
                Copy Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onReply(message)} className="cursor-pointer text-[13px]">
                Reply
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTogglePin(message.id)} className="cursor-pointer text-[13px]">
                {message.is_pinned ? 'Unpin Message' : 'Pin Message'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  )
}

function ToolbarButton({
  children,
  ariaLabel,
}: {
  children: ReactNode
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
    >
      {children}
    </button>
  )
}

function MessageContent({ content }: { content: string }) {
  const blocks = splitCodeBlocks(content)

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          return (
            <div
              key={`code-${index}`}
              className="overflow-hidden rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3 py-2 text-[11px] text-[var(--text-secondary)]">
                <span>{block.language || 'plain text'}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(block.content)}
                  className="inline-flex items-center gap-1 rounded-[8px] px-2 py-1 text-[11px] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                >
                  <Copy className="h-3.5 w-3.5" strokeWidth={1.7} />
                  Copy
                </button>
              </div>
              <pre className="overflow-x-auto px-3 py-3 text-[12px] leading-6 text-[var(--text-primary)]">
                <code>{block.content}</code>
              </pre>
            </div>
          )
        }

        return block.content
          .split('\n')
          .filter(Boolean)
          .map((paragraph, paragraphIndex) => (
            <p
              key={`text-${index}-${paragraphIndex}`}
              className={cn(isEmojiOnly(paragraph) && 'text-[28px] leading-none')}
            >
              {renderInline(paragraph)}
            </p>
          ))
      })}
    </div>
  )
}

function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`|https?:\/\/[^\s]+)/g)

  return parts.map((part, index) => {
    if (!part) return null

    if (/^`[^`]+`$/.test(part)) {
      return (
        <code
          key={index}
          className="rounded-[4px] bg-[var(--bg-elevated)] px-1 py-0.5 font-mono text-[11px] text-[var(--text-primary)]"
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    if (/^https?:\/\/[^\s]+$/.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--accent)] hover:underline"
        >
          {part}
        </a>
      )
    }

    return <Fragment key={index}>{part}</Fragment>
  })
}

function splitCodeBlocks(content: string) {
  const regex = /```([\w-]+)?\n?([\s\S]*?)```/g
  const blocks: Array<
    | { type: 'text'; content: string }
    | { type: 'code'; language?: string; content: string }
  > = []
  let lastIndex = 0

  for (const match of content.matchAll(regex)) {
    const matchIndex = match.index ?? 0

    if (matchIndex > lastIndex) {
      blocks.push({ type: 'text', content: content.slice(lastIndex, matchIndex).trim() })
    }

    blocks.push({
      type: 'code',
      language: match[1],
      content: match[2].trim(),
    })
    lastIndex = matchIndex + match[0].length
  }

  if (lastIndex < content.length) {
    blocks.push({ type: 'text', content: content.slice(lastIndex).trim() })
  }

  return blocks.filter((block) => block.content.length > 0)
}

function containsCodeBlock(content: string) {
  return content.includes('```')
}

function isEmojiOnly(content: string) {
  return /^(?:\p{Extended_Pictographic}|\s)+$/u.test(content.trim())
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
  return `linear-gradient(180deg, hsl(${hue} 70% 58%), hsl(${(hue + 32) % 360} 56% 42%))`
}
