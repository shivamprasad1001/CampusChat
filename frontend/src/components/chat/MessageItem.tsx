import { Fragment, ReactNode, useState, useRef, useLayoutEffect, memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Message } from '@/types'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  CheckCheck,
  Copy,
  CornerUpLeft,
  Heart,
  MoreHorizontal,
  Paperclip,
  Pin,
  SmilePlus,
  Play,
  Pause,
  Volume2,
  Loader2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { useAppShell } from '@/components/app-shell/AppShellContext'
import { VoiceMessagePlayer } from './VoiceRecorder'

interface MessageItemProps {
  message: Message
  isOwn: boolean
  onToggleReaction: (emoji: string) => void
  onReply: (message: Message) => void
  onTogglePin: (messageId: string) => void
  onEditMessage: (messageId: string, content: string) => void
  onDeleteMessage: (messageId: string) => void
  showHeader: boolean
  showTail: boolean
}


export default function MessageItem({
  message,
  isOwn,
  onToggleReaction,
  onReply,
  onTogglePin,
  onEditMessage,
  onDeleteMessage,
  showHeader,
  showTail,
}: MessageItemProps) {
  const { user } = useAuth()
  const { openThread } = useAppShell()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content || '')
  const [expanded, setExpanded] = useState(false)

  const isDeleted = message.is_deleted
  const profile = message.profiles
  const displayName = profile?.name || (isOwn ? 'You' : 'Unknown user')

  const reactionsMap = (message.reactions || []).reduce(
    (acc, reaction) => {
      acc[reaction.emoji] = acc[reaction.emoji] || []
      acc[reaction.emoji].push(reaction.user_id)
      return acc
    },
    {} as Record<string, string[]>
  )

  const handleReplyClick = () => {
    if (isDeleted) return
    onReply(message)
  }

  return (
    <article
      className={cn(
        'group/message relative mt-0.5 mb-0.5 flex w-full flex-col px-4 transition-all hover:bg-white/[0.02]',
        isOwn ? 'items-end' : 'items-start',
        isDeleted && 'opacity-60'
      )}
      style={{ animation: 'chat-enter 240ms var(--ease-out)' }}
    >
      {/* ... (Reply Context) ... */}
      {!isDeleted && message.parent && (
        <div
          className={cn(
            "mb-1 flex items-center gap-1.5 px-1 cursor-pointer hover:opacity-80 transition-opacity",
            isOwn ? "flex-row-reverse" : "flex-row"
          )}
          onClick={() => onReply(message.parent as Message)}
        >
          <CornerUpLeft className="h-3 w-3 text-[var(--text-muted)]" strokeWidth={2.5} />
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            {message.parent.profiles?.name || 'Someone'}
          </span>
        </div>
      )}

      {/* Message Row */}
      <div className={cn('flex w-full items-end gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
        {/* Avatar or Spacer */}
        {showTail ? (
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full shadow-sm select-none"
            style={{
              background: !profile?.avatar_url ? createAvatarGradient(displayName) : 'transparent',
            }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-white/90">
                {getInitials(displayName)}
              </span>
            )}
          </div>
        ) : (
          <div className="w-7 flex-shrink-0" /> // Spacer to maintain indentation
        )}

        {/* Bubble Container */}
        <div className="relative max-w-[85%] md:max-w-[85%] lg:max-w-[1000px]">
          <div
            className={cn(
              'relative rounded-[20px] px-3.5 py-2 px-4 shadow-sm transition-all',
              isOwn
                ? 'bg-[var(--bubble-me)] text-white'
                : 'bg-[var(--bubble-other)] text-white',
              // Tail at the bottom corner (Mac style)
              showTail && (isOwn ? 'bubble-tail bubble-tail-me !rounded-br-[4px]' : 'bubble-tail bubble-tail-other !rounded-bl-[4px]'),
              isEditing && 'ring-2 ring-[var(--accent)]',
              isDeleted && 'bg-opacity-10 dark:bg-opacity-20 italic bg-white border border-dashed border-white/20'
            )}
          >
            {/* Sender Name (for group context, only if NOT own and it's the start of a block) */}
            {showHeader && !isOwn && !isDeleted && (
              <div className="mb-0.5 text-[11px] font-bold text-[var(--accent)] opacity-90">
                {displayName}
              </div>
            )}

            {isDeleted ? (
              <span className="text-[13px] opacity-70 italic  dark:text-black">This message was deleted</span>
            ) : isEditing ? (
              <div className="flex flex-col gap-2 min-w-[220px]">
                <textarea
                  className="w-full resize-none rounded-[var(--radius-sm)] border-none bg-black/20 p-2 text-[13.5px] text-white focus:ring-0"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  autoFocus
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsEditing(false)} className="text-[10px] uppercase font-bold text-white/70 hover:text-white">Cancel</button>
                  <button onClick={() => { onEditMessage(message.id, editContent); setIsEditing(false); }} className="text-[10px] uppercase font-bold text-white">Save</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {/* Replied-to preview block */}
                {!isDeleted && message.parent && (
                  <div className="mb-1 rounded-[12px] bg-black/20 px-2.5 py-1.5 text-[11px] text-white/80 border-l-2 border-white/30">
                    <p className="truncate opacity-60 font-bold mb-0.5">{message.parent.profiles?.name || 'Someone'}</p>
                    <p className="truncate line-clamp-1">{message.parent.content || 'Shared a file'}</p>
                  </div>
                )}

                {message.file_url && message.file_type === 'voice' && (
                  <VoiceMessagePlayer audioUrl={message.file_url} duration={message.duration || 0} />
                )}

                {message.content && <MessageContent content={message.content} isOwn={isOwn} onExpand={() => setExpanded(true)} />}

                {message.file_url && message.file_type !== 'voice' && (
                  <div className="mt-1.5 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] min-h-[100px] md:min-h-[160px] flex items-center justify-center">
                    {message.file_type?.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp|svg)($|\?)/i.test(message.file_url) ? (
                      <img
                        src={message.file_url}
                        alt="Attachment"
                        className="max-h-[300px] w-full object-cover transition-opacity duration-300 opacity-0"
                        onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                      />
                    ) : (
                      <a href={message.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-white/5 transition">
                        <Paperclip className="h-3.5 w-3.5" />
                        <span className="truncate">Download Attachment</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bubble Footer (Time & Check) */}
            {!isDeleted && !isEditing && (
              <div className={cn(
                "mt-0.5 flex items-center gap-1 text-[10px] opacity-60 font-medium",
                isOwn ? "justify-end" : "justify-start"
              )}>
                <span>{format(new Date(message.created_at), 'p')}</span>
                {isOwn && (
                  <CheckCheck className="h-3 w-3" strokeWidth={2.5} />
                )}
              </div>
            )}
          </div>

          {/* Quick Reactions Display (Spaced below bubble) */}
          {!isDeleted && Object.keys(reactionsMap).length > 0 && (
            <div className={cn('mt-2 flex flex-wrap gap-1.5', isOwn ? 'justify-end' : 'justify-start')}>
              {Object.entries(reactionsMap).map(([emoji, userIds]) => {
                const hasReacted = !!user && userIds.includes(user.id)
                return (
                  <button
                    key={emoji}
                    onClick={() => onToggleReaction(emoji)}
                    className={cn(
                      'flex h-5 items-center gap-1 rounded-full px-1.5 text-[10px] font-bold shadow-sm transition hover:scale-110 active:scale-90',
                      hasReacted ? 'bg-[var(--accent)] text-white' : 'bg-[#3e4042] text-white'
                    )}
                  >
                    <span>{emoji}</span>
                    <span>{userIds.length}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Floating Action Menu (Hover) */}
        {!isDeleted && !isEditing && (
          <div className={cn(
            'flex items-center gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity duration-200',
            isOwn ? 'flex-row' : 'flex-row-reverse'
          )}>
            <button
              onClick={() => onToggleReaction('❤️')}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-red-400 transition"
            >
              <Heart className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition">
                <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={2.5} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? 'end' : 'start'} className="min-w-[140px] rounded-xl border-none glass-panel shadow-2xl">
                <DropdownMenuItem onClick={handleReplyClick} className="cursor-pointer text-[12px] gap-2">
                  <CornerUpLeft className="h-3.5 w-3.5" /> Reply
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.content || '')} className="cursor-pointer text-[12px] gap-2">
                  <Copy className="h-3.5 w-3.5" /> Copy
                </DropdownMenuItem>
                {isOwn && (
                  <>
                    <DropdownMenuItem onClick={() => setIsEditing(true)} className="cursor-pointer text-[12px] gap-2">
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDeleteMessage(message.id)} className="cursor-pointer text-[12px] gap-2 text-red-400">
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </article>
  )
}


const MessageContent = memo(({ content, isOwn, onExpand }: { content: string; isOwn: boolean; onExpand: () => void }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [needsTruncation, setNeedsTruncation] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const MAX_HEIGHT = 420 // px threshold

  // Regex for finding @usernames
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;

  useLayoutEffect(() => {
    if (containerRef.current) {
      // Check if scrollHeight exceeds the threshold (plus a small buffer)
      if (containerRef.current.scrollHeight > MAX_HEIGHT + 40) {
        setNeedsTruncation(true)
      } else {
        setNeedsTruncation(false)
      }
    }
  }, [content])

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={cn(
          "relative flex flex-col gap-1 overflow-hidden",
          !isExpanded && needsTruncation ? "max-h-[420px]" : "max-h-none"
        )}
      >
        <div className={cn("prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent prose-pre:m-0", isEmojiOnly(content) && 'prose-p:text-[28px] prose-p:leading-none')}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ node, ...props }) => (
                <a {...props} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline" />
              ),
              p: ({ children }) => {
                const traverse = (node: any): any => {
                  if (typeof node === 'string') {
                    const matches = Array.from(node.matchAll(mentionRegex));
                    if (matches.length === 0) return node;

                    const nodes: React.ReactNode[] = [];
                    let lastPos = 0;

                    for (const match of matches) {
                      nodes.push(node.substring(lastPos, match.index));
                      nodes.push(
                        <span key={match.index} className="font-bold text-[var(--accent)] cursor-pointer hover:opacity-80 transition-opacity">
                          {match[0]}
                        </span>
                      );
                      lastPos = (match.index || 0) + match[0].length;
                    }
                    nodes.push(node.substring(lastPos));
                    return nodes;
                  }
                  if (Array.isArray(node)) return node.map(traverse);
                  if (node?.props?.children) {
                    return { ...node, props: { ...node.props, children: traverse(node.props.children) } };
                  }
                  return node;
                };

                return <p>{traverse(children)}</p>;
              },
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '')
                const language = match ? match[1] : 'text'

                if (!inline) {
                  return (
                    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] my-3 not-prose">
                      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3 py-1.5 text-[10px] font-semibold text-[var(--text-muted)] bg-[rgba(0,0,0,0.2)]">
                        <span>{language}</span>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                          className="inline-flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-[10px] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                        >
                          <Copy className="h-3 w-3" strokeWidth={1.8} />
                          Copy
                        </button>
                      </div>
                      <pre className="overflow-x-auto px-4 py-3 text-[12px] leading-6 text-[var(--text-primary)] m-0 bg-transparent">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  )
                }
                return (
                  <code className="rounded-[4px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--text-primary)]" {...props}>
                    {children}
                  </code>
                )
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {!isExpanded && needsTruncation && (
          <div className="absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none z-10" />
        )}
      </div>

      {needsTruncation && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-1 text-[11px] font-bold text-[var(--accent)] hover:opacity-80 transition-opacity uppercase tracking-wider h-8 flex items-center"
        >
          {isExpanded ? 'Show Less' : 'Read More'}
        </button>
      )}
    </div>
  )
})

function containsCodeBlock(content: string) {
  return content.includes('```')
}

/**
 * More robust emoji-only check that handles various unicode ranges and lengths.
 */
function isEmojiOnly(text: string) {
  if (!text) return false;
  const emojiRegex = /^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3?|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2194-\u2199]|\s)+$/u;
  return emojiRegex.test(text.trim()) && text.trim().length <= 12;
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
  return `linear-gradient(135deg, hsl(${hue} 70% 58%), hsl(${(hue + 32) % 360} 56% 42%))`
}
