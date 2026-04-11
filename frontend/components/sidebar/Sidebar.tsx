'use client'

import RoomList from './RoomList'
import UserBar from './UserBar'
import { GraduationCap } from 'lucide-react'
import Link from 'next/link'

export default function Sidebar() {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
      <div className="p-6">
        <Link href="/" className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            CampusChat
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <RoomList />
      </div>

      <UserBar />
    </div>
  )
}
