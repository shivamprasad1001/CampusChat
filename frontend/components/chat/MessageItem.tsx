'use client'

import { Message } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MessageItemProps {
  message: Message
  isOwn: boolean
  onToggleReaction: (emoji: string) => void
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥']

export default function MessageItem({ message, isOwn, onToggleReaction }: MessageItemProps) {
  const { user } = useAuth()
  const profile = message.profiles || {}

  // Group reactions by emoji
  const reactionsMap = (message.reactions || []).reduce((acc, r) => {
    acc[r.emoji] = acc[r.emoji] || []
    acc[r.emoji].push(r.user_id)
    return acc
  }, {} as Record<string, string[]>)

  return (
    <div className={cn(
      "flex items-start space-x-3 group px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors",
      isOwn && "flex-row-reverse space-x-reverse"
    )}>
      <Avatar className="h-9 w-9 mt-0.5">
        <AvatarImage src={profile.avatar_url} />
        <AvatarFallback className="bg-indigo-600 text-white">
          {profile.name?.substring(0, 2).toUpperCase() || '??'}
        </AvatarFallback>
      </Avatar>

      <div className={cn(
        "flex flex-col max-w-[70%]",
        isOwn ? "items-end" : "items-start"
      )}>
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {profile.name}
          </span>
          <span className="text-xs text-gray-500">
            {format(new Date(message.created_at), 'HH:mm')}
          </span>
        </div>

        <div className={cn(
          "px-4 py-2.5 rounded-2xl text-sm shadow-sm leading-relaxed",
          isOwn 
            ? "bg-indigo-600 text-white rounded-tr-none" 
            : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none"
        )}>
          {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
          
          {message.file_url && (
            <div className="mt-2 rounded-lg overflow-hidden border border-black/10">
              {message.file_type?.startsWith('image/') ? (
                <div className="relative aspect-video w-64 bg-gray-100 dark:bg-gray-900 cursor-pointer overflow-hidden">
                  <img 
                    src={message.file_url} 
                    alt="attachment" 
                    className="object-cover hover:scale-105 transition-transform duration-300" 
                  />
                </div>
              ) : (
                <a 
                  href={message.file_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded">
                    📎
                  </div>
                  <span className="text-xs font-medium truncate max-w-[150px]">
                    Download File
                  </span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Reactions */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {Object.entries(reactionsMap).map(([emoji, userIds]) => {
            const hasReacted = user && userIds.includes(user.id)
            return (
              <button 
                key={emoji}
                onClick={() => onToggleReaction(emoji)}
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-xs flex items-center space-x-1 shadow-sm transition-all active:scale-95",
                  hasReacted 
                    ? "bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 border" 
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                )}
              >
                <span>{emoji}</span>
                <span className={cn(
                  "font-medium",
                  hasReacted ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500"
                )}>
                  {userIds.length}
                </span>
              </button>
            )
          })}
          
          {/* Reaction Picker Trigger */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
            <DropdownMenu>
              <DropdownMenuTrigger className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors focus:outline-hidden">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="flex flex-row p-1 gap-1 min-w-0 w-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
                {COMMON_EMOJIS.map(emoji => (
                  <DropdownMenuItem
                    key={emoji}
                    onClick={() => onToggleReaction(emoji)}
                    className="p-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-lg focus:bg-gray-100 dark:focus:bg-gray-700 outline-hidden"
                  >
                    {emoji}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}
