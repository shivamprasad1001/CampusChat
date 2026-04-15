
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
    <div className="px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-1 md:px-4">
      <input
        type="file"
        hidden
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <div
        className={cn(
          'mx-auto max-w-[960px] rounded-[var(--radius-lg)] border overflow-hidden transition-all duration-200',
          'bg-[var(--bg-elevated)] shadow-[var(--shadow-md)]',
          isFocused
            ? 'border-[var(--accent)] shadow-[0_0_0_3px_var(--accent-muted),var(--shadow-md)]'
            : 'border-[var(--border-default)]'
        )}
      >
        {/* Reply Preview Header */}
        {replyingTo && (
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)] px-4 py-2">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-[var(--accent)]">
                Replying to {replyingTo.profiles?.name || 'User'}
              </span>
              <p className="truncate text-[11px] text-[var(--text-muted)] opacity-80">
                {replyingTo.content}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancelReply}
              className="ml-2 flex h-6 w-6 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex min-h-16 items-end gap-1.5 px-3 py-2.5 md:gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="mb-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Attach file"
          >
            <Paperclip className="h-4 w-4" strokeWidth={1.8} />
          </button>

          <div className="flex-1 min-w-0">
            <div
              ref={editorRef}
              contentEditable
              role="textbox"
              aria-multiline="true"
              data-placeholder="Message the room…"
              className="relative min-h-[36px] max-h-36 overflow-y-auto rounded-[var(--radius-sm)] px-1 py-1 text-[var(--msg-font-size)] leading-[1.6] text-[var(--text-primary)] outline-none before:pointer-events-none before:absolute before:text-[var(--text-muted)] empty:before:content-[attr(data-placeholder)]"
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
              className="mb-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              aria-label="Add emoji"
            >
              <SmilePlus className="h-4 w-4" strokeWidth={1.8} />
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
              'mb-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] shadow-[var(--shadow-xs)] transition-all',
              content.trim()
                ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-[0.94]'
                : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'
            )}
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-3 py-1.5 text-[10px] text-[var(--text-muted)]">
          <span>Enter to send • Shift+Enter for new line</span>
          <span>{isUploading ? 'Uploading…' : `${content.length} chars`}</span>
        </div>
      </div>
    </div>
  )
}
