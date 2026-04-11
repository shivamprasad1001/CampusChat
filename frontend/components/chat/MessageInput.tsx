'use client'

import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Paperclip, Send, Smile } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

interface MessageInputProps {
  onSendMessage: (content: string, fileUrl?: string) => void
  onTyping: () => void
}

export default function MessageInput({ onSendMessage, onTyping }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    onSendMessage(content)
    setContent('')
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      onSendMessage('', data.url)
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2 max-w-6xl mx-auto">
        <input 
          type="file" 
          hidden 
          ref={fileInputRef} 
          onChange={handleFileChange}
        />
        
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          className="text-gray-500 hover:text-indigo-600 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <div className="relative flex-1 group">
          <Input 
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              onTyping()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder="Type your message..."
            className="pr-12 bg-gray-100/50 dark:bg-gray-900 border-none focus-visible:ring-1 focus-visible:ring-indigo-500 rounded-xl py-6 h-auto"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            <Smile className="h-5 w-5 text-gray-400 cursor-pointer hover:text-orange-500 transition-colors" />
          </div>
        </div>

        <Button 
          type="submit" 
          size="icon" 
          disabled={!content.trim() || isUploading}
          className={cn(
            "h-12 w-12 rounded-xl shadow-lg transition-all",
            content.trim() 
              ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none hover:scale-105 active:scale-95" 
              : "bg-gray-100 dark:bg-gray-800 text-gray-400"
          )}
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  )
}
