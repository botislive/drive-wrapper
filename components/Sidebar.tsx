// components/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { StorageMetrics } from './StorageMetrics'

export function Sidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const handleSignout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: '🏠' },
    { name: 'Documentation', href: '/dashboard/docs', icon: '📚' },
    { name: 'Snippet Generator', href: '/dashboard/generator', icon: '⚡' },
    { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass-sidebar hidden md:flex flex-col z-50">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">D</div>
          <span className="text-xl font-bold text-zinc-800 tracking-tight">DriveWrapper</span>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-600 shadow-sm border border-blue-600/10' 
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-zinc-200/50">
        <StorageMetrics />
        <div className="px-4 py-3 bg-zinc-50/50 rounded-xl border border-zinc-200/50 mb-3">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Authenticated as</p>
          <p className="text-sm font-semibold text-zinc-800 truncate">{user?.email || 'Loading...'}</p>
        </div>
        <button
          onClick={handleSignout}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <span>🚪</span> Sign out
        </button>
      </div>
    </aside>
  )
}
