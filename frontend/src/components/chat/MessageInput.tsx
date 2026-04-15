
import { useEffect, useRef, useState } from 'react'
import { Paperclip, Send, SmilePlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { Message } from '@/types'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MessageInputProps {
  onSendMessage: (content: string, fileUrl?: string) => void
  onTyping: () => void
  replyingTo?: Message | null
  onCancelReply?: () => void
}

export default function MessageInput({
  onSendMessage,
  onTyping,
  replyingTo,
  onCancelReply,
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!editorRef.current) return
    if (editorRef.current.innerText === content) return
    editorRef.current.innerText = content
  }, [content])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const emitTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTyping()
    }, 300)
  }

  const submit = (fileUrl?: string) => {
    const nextContent = editorRef.current?.innerText.trim() ?? content.trim()

    if (!nextContent && !fileUrl) return

    onSendMessage(nextContent, fileUrl)
    setContent('')

    if (editorRef.current) {
      editorRef.current.innerText = ''
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await api.post('/upload', formData)
      submit(data.url)
    } catch (error) {
      console.error('Upload failed', error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 md:px-4">
      <input
        type="file"
        hidden
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <div
        className={cn(
          'mx-auto max-w-[960px] rounded-[14px] border bg-[var(--bg-elevated)] shadow-[var(--shadow-md)] overflow-hidden',
          isFocused
            ? 'border-[var(--accent)] shadow-[0_0_0_4px_var(--accent-glow),var(--shadow-md)]'
            : 'border-[var(--border-default)]'
        )}
      >
        {/* Reply Preview Header */}
        {replyingTo && (
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] px-4 py-2">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-[var(--accent)]">
                Replying to {replyingTo.profiles?.name || 'User'}
              </span>
              <p className="truncate text-[12px] text-[var(--text-secondary)] opacity-80">
                {replyingTo.content}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancelReply}
              className="ml-2 flex h-6 w-6 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex min-h-20 items-end gap-2 px-3 py-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="mb-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Attach file"
          >
            <Paperclip className="h-[18px] w-[18px]" strokeWidth={1.7} />
          </button>

          <div className="flex-1">
            <label className="mb-1 block text-[11px] font-medium text-[var(--text-muted)]">
              Message
            </label>
            <div
              ref={editorRef}
              contentEditable
              role="textbox"
              aria-multiline="true"
              data-placeholder="Message the room, use @mentions, or press / for commands"
              className="relative min-h-[44px] max-h-40 overflow-y-auto rounded-[10px] px-1 py-1 text-[15px] leading-[1.6] text-[var(--text-primary)] outline-none before:pointer-events-none before:absolute before:text-[var(--text-muted)] empty:before:content-[attr(data-placeholder)]"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onInput={(event) => {
                const nextValue = event.currentTarget.innerText.replace(/\n{3,}/g, '\n\n')
                setContent(nextValue)
                emitTyping()
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  submit()
                }
              }}
              suppressContentEditableWarning
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="mb-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              aria-label="Add emoji"
            >
              <SmilePlus className="h-[18px] w-[18px]" strokeWidth={1.7} />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-auto p-0 border-none bg-transparent shadow-none min-w-[352px]" sideOffset={8}>
              <Picker
                data={data}
                onEmojiSelect={(emoji: any) => {
                  setContent(prev => prev + emoji.native)
                  if (editorRef.current) {
                    editorRef.current.innerText += emoji.native
                  }
                }}
                theme="dark"
              />
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            disabled={!content.trim() || isUploading}
            onClick={() => submit()}
            className={cn(
              'mb-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] shadow-[var(--shadow-sm)]',
              content.trim()
                ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-[0.96]'
                : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'
            )}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-3 py-2 text-[11px] text-[var(--text-muted)]">
          <span>Enter to send • Shift+Enter for a new line</span>
          <span>{isUploading ? 'Uploading attachment…' : `${content.length} characters`}</span>
        </div>
      </div>
    </div>
  )
}
