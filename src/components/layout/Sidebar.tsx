'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, FolderKanban, Users, BarChart3,
  LogOut, ChevronRight, Settings, FileText
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

interface SidebarProps {
  role: 'ADMIN' | 'POD_LEAD' | 'CLIENT'
  userName: string
  userEmail: string
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Projects', href: '/admin/projects', icon: FolderKanban },
  { label: 'Clients', href: '/admin/clients', icon: Users },
  { label: 'Timeline', href: '/admin/timeline', icon: BarChart3 },
]

const clientNav: NavItem[] = [
  { label: 'Dashboard', href: '/client', icon: LayoutDashboard },
  { label: 'My Projects', href: '/client/projects', icon: FolderKanban },
  { label: 'Timeline', href: '/client/timeline', icon: BarChart3 },
  { label: 'Updates', href: '/client/updates', icon: FileText },
]

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const nav = role === 'CLIENT' ? clientNav : adminNav

  return (
    <aside className="w-60 min-h-screen bg-slate-950 border-r border-slate-800 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <div>
            <span className="text-white font-semibold text-sm leading-none">Horizon 3DX</span>
            <p className="text-slate-500 text-[10px] mt-0.5">
              {role === 'CLIENT' ? 'Client Portal' : role === 'ADMIN' ? 'Admin' : 'Pod Lead'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/admin' && item.href !== '/client' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors group',
                active
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {active && <ChevronRight className="w-3 h-3 ml-auto text-slate-500" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-medium">{userName.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{userName}</p>
            <p className="text-xs text-slate-500 truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
