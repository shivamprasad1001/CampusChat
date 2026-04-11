'use client'

import { useAuth } from '@/hooks/useAuth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { LogOut, Settings } from 'lucide-react'

export default function UserBar() {
  const { profile, signOut } = useAuth()

  if (!profile) return null

  return (
    <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm">
      <div className="flex items-center space-x-3">
        <Avatar className="h-9 w-9 border-2 border-indigo-500/20">
          <AvatarImage src={profile.avatar_url} />
          <AvatarFallback className="bg-indigo-600 text-white">
            {profile.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate text-gray-900 dark:text-gray-100">
            {profile.name}
          </p>
          <p className="text-xs text-gray-500 truncate capitalize">
            {profile.role}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
          <Settings className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
