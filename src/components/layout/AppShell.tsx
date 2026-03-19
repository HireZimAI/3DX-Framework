import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Role } from '@prisma/client'

interface AppShellProps {
  children: React.ReactNode
  requiredRole?: Role[]
}

export async function AppShell({ children, requiredRole }: AppShellProps) {
  const session = await auth()

  if (!session) redirect('/login')
  if (requiredRole && !requiredRole.includes(session.user.role)) {
    redirect(session.user.role === 'CLIENT' ? '/client' : '/admin')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        role={session.user.role}
        userName={session.user.name ?? ''}
        userEmail={session.user.email ?? ''}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
