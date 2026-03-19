import { prisma } from '@/lib/db'
import { GanttChart } from '@/components/gantt/GanttChart'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'

export default async function AdminTimelinePage() {
  const projects = await prisma.project.findMany({
    where: { status: { not: 'COMPLETED' } },
    include: {
      client: { select: { id: true, name: true, company: true } },
      phases: { orderBy: { order: 'asc' } },
    },
    orderBy: { startDate: 'asc' },
  })

  const completedProjects = await prisma.project.findMany({
    where: { status: 'COMPLETED' },
    include: {
      client: { select: { id: true, name: true, company: true } },
      phases: { orderBy: { order: 'asc' } },
    },
    orderBy: { completedAt: 'desc' },
    take: 5,
  })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Timeline Overview</h1>
        <p className="text-slate-500 text-sm mt-0.5">All active projects and phases across all clients</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold text-slate-800">Active Projects Gantt</h2>
        </CardHeader>
        <CardContent>
          <GanttChart projects={projects as never} />
        </CardContent>
      </Card>

      {completedProjects.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Recently Completed</h2>
          </CardHeader>
          <CardContent>
            <GanttChart projects={completedProjects as never} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
