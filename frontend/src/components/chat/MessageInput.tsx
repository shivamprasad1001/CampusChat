
import { useEffect, useRef, useState, useCallback } from 'react'
import { AudioLines, Gift, Image as ImageIcon, Paperclip, Plus, Send, Smile, SmilePlus, X, Mic, Sparkles, Loader2, Settings2 } from 'lucide-react'
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
import { VoiceMessageRecorder } from './VoiceRecorder'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { AISettingsPanel } from './AISettingsPanel'

interface MessageInputProps {
  onSendMessage: (content: string, fileUrl?: string, fileType?: string, duration?: number) => void
  onTyping: () => void
  replyingTo?: Message | null
  onCancelReply?: () => void
  placeholder?: string
  recentMessages?: Message[]
  roomName?: string
  quickReplies?: string[]
  aiEnabled?: boolean
  onToggleAI?: () => void
  onSelectPersonality?: (personality: string) => void
  userId?: string
}

export default function MessageInput({
  onSendMessage,
  onTyping,
  replyingTo,
  onCancelReply,
  placeholder = 'Message',
  recentMessages = [],
  roomName = 'General',
  quickReplies = [],
  aiEnabled = false,
  onToggleAI,
  onSelectPersonality,
  userId,
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const [showAISettings, setShowAISettings] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editorRef.current) return
    if (editorRef.current.innerText === content) return
    editorRef.current.innerText = content
  }, [content])

  const submit = (fileUrl?: string, fileType?: string, duration?: number) => {
    const nextContent = editorRef.current?.innerText.trim() ?? content.trim()
    if (!nextContent && !fileUrl) return

    onSendMessage(nextContent, fileUrl, fileType, duration)
    setContent('')
    if (editorRef.current) editorRef.current.innerText = ''
    setIsRecordingVoice(false)
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const { data } = await api.post('/upload', formData)
      submit(data.url, file.type.startsWith('image/') ? 'image' : 'file')
    } catch (error) {
      console.error('Upload failed', error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleVoiceRecording = async (blob: Blob, duration: number) => {
    setIsUploading(true)
    const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' })
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const { data } = await api.post('/upload', formData)
      submit(data.url, 'voice', duration)
    } catch (error) {
      console.error('Voice upload failed', error)
    } finally {
      setIsUploading(false)
      setIsRecordingVoice(false)
    }
  }

  const generateAIResponse = async () => {
    if (isGeneratingAI) return
    setIsGeneratingAI(true)
    
    try {
      const context = recentMessages.slice(-10).map(m => ({
        sender: m.profiles?.name || 'Unknown',
        content: m.content
      }))
      
      const { data } = await api.post('/ai/reply', { context, roomName })
      
      if (data.reply) {
        setContent(data.reply)
        if (editorRef.current) {
          editorRef.current.innerText = data.reply
          editorRef.current.focus()
          const range = document.createRange()
          range.selectNodeContents(editorRef.current)
          range.collapse(false)
          const selection = window.getSelection()
          selection?.removeAllRanges()
          selection?.addRange(range)
        }
      }
    } catch (error) {
      console.error('AI Reply failed', error)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  return (
    <div className="flex flex-col w-full max-w-[960px] mx-auto px-4 pb-4 mt-auto">
       <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} />
       
       {/* Reply Banner */}
       {replyingTo && (
         <div className="mb-2 flex items-center justify-between rounded-xl glass-panel-heavy px-4 py-2 animate-in slide-in-from-bottom-2">
           <div className="min-w-0 flex-1">
             <span className="text-[11px] font-bold text-[var(--accent)]">Replying to {replyingTo.profiles?.name}</span>
             <p className="truncate text-[11px] text-[var(--text-muted)]">{replyingTo.content}</p>
           </div>
           <button onClick={onCancelReply} className="ml-2 text-[var(--text-muted)] hover:text-white transition">
             <X className="h-4 w-4" />
           </button>
         </div>
       )}
 
       {/* Quick Replies */}
       {aiEnabled && quickReplies.length > 0 && !content.trim() && !isRecordingVoice && (
         <div className="mb-2 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-1">
           {quickReplies.map((reply, i) => (
             <button
               key={i}
               onClick={() => {
                 setContent(reply)
                 if (editorRef.current) {
                   editorRef.current.innerText = reply
                   editorRef.current.focus()
                 }
               }}
               className="rounded-full bg-[var(--accent-muted)] px-3 py-1 text-[11px] font-medium text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all shadow-[var(--shadow-glow-sm)]"
             >
               {reply}
             </button>
           ))}
         </div>
       )}

       <div className="flex items-center gap-2">
         {/* Left Circles - Hide when recording voice */}
         {!isRecordingVoice && (
           <div className="flex items-center gap-1.5 shrink-0 animate-in fade-in slide-in-from-left-2 transition-all">
             <RoundButton onClick={() => fileInputRef.current?.click()}>
               <Plus className="h-4.5 w-4.5" />
             </RoundButton>
             
             <DropdownMenu>
               <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1c1c1e] text-white/70 hover:bg-[#2c2c2e] hover:text-white transition">
                 <Smile className="h-4.5 w-4.5" />
               </DropdownMenuTrigger>
               <DropdownMenuContent side="top" align="start" className="w-auto p-0 border-none bg-transparent shadow-none" sideOffset={12}>
                 <Picker 
                   data={data} 
                   theme="dark" 
                   onEmojiSelect={(emoji: any) => {
                     setContent(prev => prev + emoji.native)
                     if (editorRef.current) editorRef.current.innerText += emoji.native
                   }} 
                 />
               </DropdownMenuContent>
             </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full bg-[#1c1c1e] text-[var(--accent)] hover:bg-[#2c2c2e] transition relative",
                      isGeneratingAI && "animate-pulse",
                      aiEnabled && "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[#1c1c1e]"
                    )}
                    title="AI Auto-Reply & Personality"
                  >
                    {isGeneratingAI ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Sparkles className="h-4.5 w-4.5" />}
                    {aiEnabled && <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-48 p-1 glass-panel-heavy border-[var(--border-subtle)]">
                  <div className="px-2 py-1.5 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">AI Settings</div>
                  <button
                    onClick={onToggleAI}
                    className="flex w-full items-center justify-between rounded-md px-2 py-2 text-[13px] text-white hover:bg-[var(--bg-hover)] transition"
                  >
                    <span>Auto-Reply</span>
                    <div className={cn(
                      "h-4 w-7 rounded-full transition-colors relative",
                      aiEnabled ? "bg-[var(--accent)]" : "bg-[#3a3a3c]"
                    )}>
                      <div className={cn(
                        "absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all",
                        aiEnabled ? "left-3.5" : "left-0.5"
                      )} />
                    </div>
                  </button>
                  <div className="my-1 h-[1px] bg-[var(--border-subtle)]" />
                  <div className="px-2 py-1 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Personality</div>
                  {(['professional', 'friendly', 'witty', 'supportive'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => onSelectPersonality?.(p)}
                      className="flex w-full items-center px-2 py-2 text-[13px] text-white hover:bg-[var(--bg-hover)] rounded-md capitalize"
                    >
                      {p}
                    </button>
                  ))}
                  <div className="my-1 h-[1px] bg-[var(--border-subtle)]" />
                  <button
                    onClick={generateAIResponse}
                    disabled={isGeneratingAI}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-[13px] text-white hover:bg-[var(--bg-hover)] transition"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate Magic Reply</span>
                  </button>
                  <div className="my-1 h-[1px] bg-[var(--border-subtle)]" />
                  <button
                    onClick={() => setShowAISettings(true)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-[12px] text-[var(--accent)] hover:bg-[var(--accent-muted)] transition font-medium"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    <span>Full AI Settings...</span>
                  </button>
                </DropdownMenuContent>
              </DropdownMenu>

              <Dialog open={showAISettings} onOpenChange={setShowAISettings}>
                <DialogContent className="max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none">
                  <AISettingsPanel 
                    userId={userId || ''} 
                    apiKey={import.meta.env.VITE_GEMINI_API_KEY} 
                    onClose={() => setShowAISettings(false)} 
                  />
                </DialogContent>
              </Dialog>
           </div>
         )}

         {/* Capsule Input / Voice Recorder */}
         <div className={cn(
           "flex flex-1 items-center gap-2 rounded-[24px] bg-[#242526] px-4 py-2 transition-all min-h-[44px]",
           isFocused && !isRecordingVoice && "ring-2 ring-[var(--accent)]"
         )}>
           {isRecordingVoice ? (
             <VoiceMessageRecorder 
               onSend={handleVoiceRecording} 
               onCancel={() => setIsRecordingVoice(false)} 
             />
           ) : (
             <>
               <div className="flex-1">
                 <div
                   ref={editorRef}
                   contentEditable
                   role="textbox"
                   aria-multiline="true"
                   data-placeholder={placeholder}
                   className="relative min-h-[24px] max-h-32 overflow-y-auto py-0.5 text-[14px] text-white outline-none before:pointer-events-none before:absolute before:text-white/40 empty:before:content-[attr(data-placeholder)]"
                   onFocus={() => setIsFocused(true)}
                   onBlur={() => setIsFocused(false)}
                   onInput={(e) => {
                     setContent(e.currentTarget.innerText)
                     onTyping()
                   }}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault()
                       submit()
                     }
                   }}
                   suppressContentEditableWarning
                 />
               </div>

               <div className="flex items-center gap-2.5 shrink-0 text-white/50">
                 {isUploading ? (
                   <Loader2 className="h-4.5 w-4.5 animate-spin" />
                 ) : (
                   <>
                     {!content.trim() && (
                       <button 
                         onClick={() => setIsRecordingVoice(true)}
                         className="hover:text-white transition"
                         aria-label="Record voice message"
                       >
                         <Mic className="h-4.5 w-4.5" />
                       </button>
                     )}
                     {content.trim() && (
                       <button 
                         onClick={() => submit()}
                         className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-white hover:scale-105 active:scale-95 transition-all"
                       >
                         <Send className="h-3.5 w-3.5 ml-0.5" strokeWidth={2.5} />
                       </button>
                     )}
                   </>
                 )}
               </div>
             </>
           )}
         </div>
       </div>
    </div>
  )
}

function RoundButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1c1c1e] text-white/70 hover:bg-[#2c2c2e] hover:text-white transition"
    >
      {children}
    </button>
  )
}
