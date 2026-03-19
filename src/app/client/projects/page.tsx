import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { ProjectCard } from '@/components/projects/ProjectCard'

export default async function ClientProjectsPage() {
  const session = await auth()
  if (!session || !session.user.clientId) redirect('/login')

  const projects = await prisma.project.findMany({
    where: { clientId: session.user.clientId },
    include: {
      client: { select: { id: true, name: true, company: true } },
      podLead: { select: { name: true } },
      phases: { orderBy: { order: 'asc' } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const active = projects.filter(p => p.status !== 'COMPLETED')
  const completed = projects.filter(p => p.status === 'COMPLETED')

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
        <p className="text-slate-500 text-sm mt-0.5">{projects.length} total projects</p>
      </div>

      {active.length > 0 && (
        <section className="mb-8">
          <h2 className="font-semibold text-slate-700 mb-4">Active</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {active.map(p => (
              <ProjectCard key={p.id} project={p} basePath="/client" showClient={false} />
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="font-semibold text-slate-700 mb-4">Completed</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completed.map(p => (
              <ProjectCard key={p.id} project={p} basePath="/client" showClient={false} />
            ))}
          </div>
        </section>
      )}

      {projects.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <p className="text-lg font-medium">No projects yet</p>
          <p className="text-sm mt-1">Your projects will appear here once created by your delivery team.</p>
        </div>
      )}
    </div>
  )
}
