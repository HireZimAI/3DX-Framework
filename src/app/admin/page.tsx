import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { StatCard } from '@/components/ui/StatCard'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { formatDate, getStatusColor, labelForStatus } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import {
  FolderKanban, CheckCircle, AlertTriangle, PauseCircle,
  Clock, TrendingUp
} from 'lucide-react'
import { addDays } from 'date-fns'
import Link from 'next/link'

export default async function AdminDashboard() {
  const session = await auth()

  const [activeCount, completedCount, atRiskCount, onHoldCount, recentProjects, upcomingDeadlines] = await Promise.all([
    prisma.project.count({ where: { status: 'ACTIVE' } }),
    prisma.project.count({ where: { status: 'COMPLETED' } }),
    prisma.project.count({ where: { status: 'AT_RISK' } }),
    prisma.project.count({ where: { status: 'ON_HOLD' } }),
    prisma.project.findMany({
      where: { status: { not: 'COMPLETED' } },
      include: {
        client: { select: { name: true, company: true } },
        podLead: { select: { name: true } },
        phases: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    }),
    prisma.project.findMany({
      where: {
        status: { not: 'COMPLETED' },
        targetEndDate: { lte: addDays(new Date(), 14) },
      },
      include: { client: { select: { name: true, company: true } } },
      orderBy: { targetEndDate: 'asc' },
      take: 5,
    }),
  ])

  const recentComments = await prisma.comment.findMany({
    where: { isInternal: false },
    include: {
      project: { select: { id: true, name: true } },
      author: { select: { name: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Good {getTimeOfDay()}, {session?.user.name?.split(' ')[0]}
        </h1>
        <p className="text-slate-500 mt-1">Here's your delivery overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active Projects"
          value={activeCount}
          icon={FolderKanban}
          iconClass="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Completed"
          value={completedCount}
          icon={CheckCircle}
          iconClass="bg-green-50 text-green-600"
        />
        <StatCard
          label="At Risk"
          value={atRiskCount}
          icon={AlertTriangle}
          iconClass="bg-red-50 text-red-600"
        />
        <StatCard
          label="On Hold"
          value={onHoldCount}
          icon={PauseCircle}
          iconClass="bg-gray-50 text-gray-500"
        />
      </div>

      {/* Projects + Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Projects Grid */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Active Projects</h2>
            <Link href="/admin/projects" className="text-sm text-violet-600 hover:text-violet-800">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentProjects.map(project => (
              <ProjectCard key={project.id} project={project} basePath="/admin" />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <h3 className="font-semibold text-slate-800 text-sm">Upcoming Deadlines</h3>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-slate-400 px-6 py-4">No deadlines in the next 14 days.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {upcomingDeadlines.map(p => (
                    <Link
                      key={p.id}
                      href={`/admin/projects/${p.id}`}
                      className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.client.company}</p>
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                        {formatDate(p.targetEndDate)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <h3 className="font-semibold text-slate-800 text-sm">Recent Updates</h3>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentComments.length === 0 ? (
                <p className="text-sm text-slate-400 px-6 py-4">No recent updates.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {recentComments.map(c => (
                    <Link
                      key={c.id}
                      href={`/admin/projects/${c.project.id}`}
                      className="block px-6 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <p className="text-xs font-medium text-slate-600 mb-0.5">{c.project.name}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{c.content}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{c.author.name}</p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
