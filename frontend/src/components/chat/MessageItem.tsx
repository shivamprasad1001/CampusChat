import { Fragment, ReactNode, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Message } from '@/types'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
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
import { useAppShell } from '@/components/app-shell/AppShellContext'

interface MessageItemProps {
  message: Message
  isOwn: boolean
  onToggleReaction: (emoji: string) => void
  onReply: (message: Message) => void
  onTogglePin: (messageId: string) => void
  onEditMessage: (messageId: string, content: string) => void
  onDeleteMessage: (messageId: string) => void
  showHeader: boolean
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
}: MessageItemProps) {
  const { user } = useAuth()
  const { openThread } = useAppShell()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content || '')
  
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
    openThread(message.id)
    onReply(message) // Keep the parentId state in sync for the RoomPage
  }

  return (
    <article
      className={cn(
        'group/message relative mx-1 rounded-[var(--radius-md)] px-3 py-[var(--density-padding)] text-[var(--msg-font-size)] transition-colors duration-150 hover:bg-[var(--bg-hover)]/50',
        !showHeader && 'pt-[calc(var(--density-padding)/2)]',
        isOwn && 'flex-row-reverse',
        isDeleted && 'opacity-60'
      )}
      style={{ animation: 'chat-enter 200ms var(--ease-spring)' }}
    >
      {/* ... (rest of the header logic) */}
      <div className={cn(
        'pointer-events-none absolute top-2 hidden text-[10px] text-[var(--text-muted)] group-hover/message:block md:block md:opacity-0 md:group-hover/message:opacity-100 transition-opacity',
        isOwn ? 'left-3' : 'right-3'
      )}>
        <time
          dateTime={message.created_at}
          aria-label={format(new Date(message.created_at), 'PPpp')}
        >
          {format(new Date(message.created_at), 'p')}
        </time>
      </div>

      <div className={cn('flex gap-[var(--density-gap)]', isOwn && 'flex-row-reverse')}>
        <div className="w-8 shrink-0">
          {showHeader ? (
            <Avatar className="h-8 w-8 border border-[var(--border-default)] shadow-[var(--shadow-xs)]">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback
                className="text-[10px] font-bold text-white"
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
            <div className={cn('mb-1 flex items-center gap-2', isOwn ? 'flex-row-reverse pr-0 pl-16' : 'pr-16')}>
              <span className="text-[12px] font-bold text-[var(--text-primary)]">{displayName}</span>
              {profile?.username && (
                <span className="text-[10px] text-[var(--accent)] font-medium">@{profile.username}</span>
              )}
              <time className="text-[10px] text-[var(--text-muted)]">
                {format(new Date(message.created_at), 'MMM d, p')}
              </time>
              {message.edited && !isDeleted && (
                <span className="text-[10px] text-[var(--text-muted)] italic">(edited)</span>
              )}
              {message.is_pinned && !isDeleted && (
                <div className="flex items-center gap-0.5 text-[10px] font-semibold text-[var(--accent)]">
                  <Pin className="h-2.5 w-2.5 rotate-45" />
                  <span>Pinned</span>
                </div>
              )}
            </div>
          )}

          {/* ... (rest of the rendering logic: isDeleted, isEditing, reactions) */}
          {/* Reply Context Bar */}
          {!isDeleted && message.parent && (
            <div className={cn(
              "mb-1 flex items-center gap-1.5 overflow-hidden rounded-[var(--radius-sm)] border-l-2 border-[var(--accent)] bg-black/5 dark:bg-white/5 py-1 px-2.5 max-w-[400px] cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors",
              isOwn && "flex-row-reverse border-l-0 border-r-2"
            )}
            onClick={() => message.parent?.id && openThread(message.parent.id)}
            >
              <CornerUpLeft className="h-3 w-3 shrink-0 text-[var(--accent)]" />
              <div className="flex flex-1 items-center gap-1.5 min-w-0">
                <span className="text-[11px] font-bold text-[var(--accent)] shrink-0">
                  {message.parent.profiles?.name || 'Someone'}
                </span>
                <span className="truncate text-[11px] text-[var(--text-muted)]">
                  {message.parent.is_deleted ? 'This message was deleted' : (message.parent.content || 'Shared a file')}
                </span>
              </div>
            </div>
          )}

          <div
            className={cn(
              'max-w-[min(78ch,100%)] rounded-[var(--radius-md)] border border-transparent px-3 py-2 text-[var(--msg-font-size)] leading-[1.65] text-[var(--text-primary)]',
              isOwn 
                ? 'bg-[var(--accent)] bg-opacity-10 border-[var(--accent)]/15 text-left' 
                : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)]',
              isDeleted && 'bg-black/5 dark:bg-white/5 italic text-[var(--text-muted)]',
              !showHeader && (isOwn ? 'pr-0.5' : 'pl-0.5')
            )}
          >
            {isDeleted ? (
              <span className="text-[13px]">This message was deleted</span>
            ) : isEditing ? (
              <div className="flex flex-col gap-2 min-w-[200px] text-left">
                <textarea
                  className="w-full resize-none rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[13px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-muted)]"
                  value={editContent}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditContent(e.target.value)}
                  autoFocus
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsEditing(false)} className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition font-medium">Cancel</button>
                  <button onClick={() => {
                    onEditMessage(message.id, editContent);
                    setIsEditing(false);
                  }} className="text-[11px] bg-[var(--accent)] px-3 py-1 rounded-[var(--radius-sm)] text-white font-semibold hover:bg-[var(--accent-hover)] transition">Save</button>
                </div>
              </div>
            ) : message.content ? (
              <MessageContent content={message.content} />
            ) : (
              <p className="text-[var(--text-secondary)]">Shared an attachment</p>
            )}

            {message.file_url && !isDeleted && (
              <div className="mt-2 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                {message.file_type?.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp|svg)($|\?)/i.test(message.file_url) ? (
                  <img
                    src={message.file_url}
                    alt="Attachment preview"
                    className="max-h-[300px] w-full object-cover"
                  />
                ) : (
                  <a
                    href={message.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 px-4 py-3 text-[12px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                  >
                    <span className="truncate">Download attachment</span>
                    <span className="text-[11px] font-semibold text-[var(--accent)]">Open</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {!isDeleted && ((message.reply_count || 0) > 0) && (
            <button 
              onClick={handleReplyClick}
              className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-[var(--accent)] hover:underline"
            >
              <CornerUpLeft className="h-3 w-3" />
              {message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}
            </button>
          )}

          {!isDeleted && Object.keys(reactionsMap).length > 0 && (
            <div className={cn('mt-1.5 flex flex-wrap gap-1.5', isOwn && 'justify-end')}>
              {Object.entries(reactionsMap).map(([emoji, userIds]) => {
                const hasReacted = !!user && userIds.includes(user.id)

                return (
                  <button
                    key={emoji}
                    onClick={() => onToggleReaction(emoji)}
                    className={cn(
                      'inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[11px] font-medium shadow-[var(--shadow-xs)] transition hover:scale-[1.05]',
                      hasReacted
                        ? 'border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--text-primary)]'
                        : 'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                    )}
                    style={{ animation: 'reaction-pop 180ms var(--ease-spring)' }}
                  >
                    <span>{emoji}</span>
                    <span className="font-bold">{userIds.length}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Action toolbar */}
      {!isDeleted && (
      <div className={cn(
        'pointer-events-none absolute top-0 hidden -translate-y-1/2 opacity-0 transition group-hover/message:pointer-events-auto group-hover/message:opacity-100 md:flex',
        isOwn ? 'left-4' : 'right-4'
      )}>
        <div className="flex items-center gap-0.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-0.5 shadow-[var(--shadow-md)]">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              aria-label="Add reaction"
            >
              <SmilePlus className="h-3.5 w-3.5" strokeWidth={1.7} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isOwn ? 'start' : 'end'} className="w-auto bg-transparent border-none p-0 shadow-none min-w-[352px]">
              <Picker
                data={data}
                onEmojiSelect={(emoji: any) => onToggleReaction(emoji.native)}
                theme="dark"
              />
            </DropdownMenuContent>
          </DropdownMenu>

          <ToolbarButton ariaLabel="Reply to message" onClick={handleReplyClick}>
            <CornerUpLeft className="h-3.5 w-3.5" strokeWidth={1.7} />
          </ToolbarButton>
          
          <ToolbarButton 
            ariaLabel="Pin message" 
            onClick={() => onTogglePin(message.id)}
            className={message.is_pinned ? 'text-[var(--accent)] bg-[var(--accent-muted)]' : ''}
          >
            <Pin className={cn("h-3.5 w-3.5", message.is_pinned && "rotate-45")} strokeWidth={1.7} />
          </ToolbarButton>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              aria-label="More actions"
            >
              <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.7} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isOwn ? 'start' : 'end'}
              className="min-w-[170px] rounded-[var(--radius-md)] border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-lg)]"
            >
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.content || '')} className="cursor-pointer text-[12px]">
                Copy Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReplyClick} className="cursor-pointer text-[12px]">
                Reply
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTogglePin(message.id)} className="cursor-pointer text-[12px]">
                {message.is_pinned ? 'Unpin Message' : 'Pin Message'}
              </DropdownMenuItem>
              {isOwn && (
                <>
                  <DropdownMenuItem onClick={() => setIsEditing(true)} className="cursor-pointer text-[12px]">
                    Edit Message
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDeleteMessage(message.id)} className="cursor-pointer text-[12px] text-red-400 focus:text-red-300">
                    Delete Message
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      )}

      {/* Mobile: Long-press / tap MoreHorizontal button */}
      <div className={cn(
        'absolute top-1 md:hidden',
        isOwn ? 'left-2' : 'right-2'
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-[var(--text-muted)] opacity-0 group-hover/message:opacity-100 active:opacity-100"
            aria-label="Message actions"
          >
            <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.8} />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={isOwn ? 'start' : 'end'}
            className="min-w-[170px] rounded-[var(--radius-md)] border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-lg)]"
          >
            <DropdownMenuItem onClick={() => onToggleReaction('👍')} className="cursor-pointer text-[12px]">👍 React</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onReply(message)} className="cursor-pointer text-[12px]">Reply</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.content || '')} className="cursor-pointer text-[12px]">Copy Text</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTogglePin(message.id)} className="cursor-pointer text-[12px]">
              {message.is_pinned ? 'Unpin' : 'Pin'}
            </DropdownMenuItem>
            {isOwn && (
              <>
                <DropdownMenuItem onClick={() => setIsEditing(true)} className="cursor-pointer text-[12px]">Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDeleteMessage(message.id)} className="cursor-pointer text-[12px] text-red-400">Delete</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  )
}

function ToolbarButton({
  children,
  ariaLabel,
  onClick,
  className,
}: {
  children: ReactNode
  ariaLabel: string
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]",
        className
      )}
    >
      {children}
    </button>
  )
}

function MessageContent({ content }: { content: string }) {
  // Regex for finding @usernames
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  
  // Custom renderer for mention text within markdown
  const renderers = {
    text: ({ value }: { value: string }) => {
      const parts = value.split(mentionRegex);
      if (parts.length <= 1) return <>{value}</>;

      const elements: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;
      
      // Reset regex index
      mentionRegex.lastIndex = 0;
      
      while ((match = mentionRegex.exec(value)) !== null) {
        // Add text before mention
        elements.push(value.substring(lastIndex, match.index));
        // Add highlighted mention
        elements.push(
          <span key={match.index} className="font-bold text-[var(--accent)] hover:underline cursor-pointer">
            {match[0]}
          </span>
        );
        lastIndex = mentionRegex.lastIndex;
      }
      
      // Add remaining text
      elements.push(value.substring(lastIndex));
      return <>{elements}</>;
    }
  };

  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent prose-pre:m-0", isEmojiOnly(content) && 'prose-p:text-[28px] prose-p:leading-none')}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline" />
          ),
          // We override the text node to handle mentions manually
          p: ({ children }) => {
            // Traverse children to find text nodes and apply mention highlighting
            const traverse = (node: any): any => {
              if (typeof node === 'string') {
                const parts = node.split(mentionRegex);
                if (parts.length <= 1) return node;

                const nodes: React.ReactNode[] = [];
                let i = 0;
                const matches = node.matchAll(mentionRegex);
                let lastPos = 0;

                for (const match of matches) {
                  nodes.push(node.substring(lastPos, match.index));
                  nodes.push(
                    <span key={match.index} className="font-bold text-[var(--accent)] cursor-pointer hover:opacity-80 transition-opacity">
                      {match[0]}
                    </span>
                  );
                  lastPos = (match.index || 0) + match[0].length;
                  i++;
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
  )
}

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
