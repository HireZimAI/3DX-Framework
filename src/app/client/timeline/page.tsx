import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { GanttChart } from '@/components/gantt/GanttChart'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'

export default async function ClientTimelinePage() {
  const session = await auth()
  if (!session || !session.user.clientId) redirect('/login')

  const projects = await prisma.project.findMany({
    where: { clientId: session.user.clientId },
    include: {
      client: { select: { id: true, name: true, company: true } },
      phases: { orderBy: { order: 'asc' } },
    },
    orderBy: { startDate: 'asc' },
  })

  const active = projects.filter(p => p.status !== 'COMPLETED')
  const completed = projects.filter(p => p.status === 'COMPLETED')

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Timeline</h1>
        <p className="text-slate-500 text-sm mt-0.5">Visual overview of your project phases</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold text-slate-800">Active Projects</h2>
        </CardHeader>
        <CardContent>
          <GanttChart projects={active as never} />
        </CardContent>
      </Card>

      {completed.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Completed Projects</h2>
          </CardHeader>
          <CardContent>
            <GanttChart projects={completed as never} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
