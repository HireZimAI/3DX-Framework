import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { formatDate, getPhaseColor, labelForStatus } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { FolderKanban, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function ClientDashboard() {
  const session = await auth()
  if (!session || !session.user.clientId) redirect('/login')

  const clientId = session.user.clientId

  const [client, projects] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId } }),
    prisma.project.findMany({
      where: { clientId },
      include: {
        client: { select: { id: true, name: true, company: true } },
        podLead: { select: { name: true } },
        phases: { orderBy: { order: 'asc' } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  const activeProjects = projects.filter(p => p.status !== 'COMPLETED')
  const completedProjects = projects.filter(p => p.status === 'COMPLETED')
  const atRiskProjects = projects.filter(p => p.status === 'AT_RISK')

  // What does client need to do right now
  const clientActions = projects.flatMap(p =>
    p.phases
      .filter(ph => ph.clientDependencies && ph.status !== 'COMPLETE')
      .map(ph => ({ project: p.name, projectId: p.id, action: ph.clientDependencies!, phase: ph.name }))
  )

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome, {session.user.name?.split(' ')[0]}
        </h1>
        <p className="text-slate-500 mt-1">
          {client?.company} · Here's your project overview.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Projects" value={activeProjects.length} icon={FolderKanban} iconClass="bg-blue-50 text-blue-600" />
        <StatCard label="Completed" value={completedProjects.length} icon={CheckCircle} iconClass="bg-green-50 text-green-600" />
        <StatCard label="At Risk" value={atRiskProjects.length} icon={AlertTriangle} iconClass="bg-red-50 text-red-600" />
        <StatCard
          label="Avg Progress"
          value={`${activeProjects.length ? Math.round(activeProjects.reduce((s, p) => s + p.progress, 0) / activeProjects.length) : 0}%`}
          icon={Clock}
          iconClass="bg-violet-50 text-violet-600"
        />
      </div>

      {/* Action Required */}
      {clientActions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
          <h2 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Action Required From You
          </h2>
          <div className="space-y-3">
            {clientActions.map((action, i) => (
              <Link key={i} href={`/client/projects/${action.projectId}`} className="block">
                <div className="p-3 bg-white rounded-lg border border-amber-100 hover:border-amber-300 transition-colors">
                  <p className="text-xs font-semibold text-amber-700 mb-1">{action.project} · {action.phase}</p>
                  <p className="text-sm text-slate-700">{action.action}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Active Projects */}
      {activeProjects.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Your Projects</h2>
            <Link href="/client/projects" className="text-sm text-violet-600 hover:text-violet-800">View all →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeProjects.map(project => (
              <ProjectCard key={project.id} project={project} basePath="/client" showClient={false} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Projects */}
      {completedProjects.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-900 mb-4">Completed Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedProjects.map(project => (
              <ProjectCard key={project.id} project={project} basePath="/client" showClient={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
