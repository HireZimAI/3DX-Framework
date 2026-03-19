import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ProjectDetailView } from '@/components/projects/ProjectDetailView'

export default async function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      podLead: { select: { id: true, name: true, email: true } },
      phases: {
        orderBy: { order: 'asc' },
        include: { tasks: { orderBy: { order: 'asc' } } },
      },
      comments: {
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { name: true, role: true } } },
      },
      changeRequests: {
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { name: true } },
          impactedPhases: { select: { id: true, name: true, type: true } },
        },
      },
    },
  })

  if (!project) notFound()

  return (
    <ProjectDetailView
      project={project as never}
      isInternal={true}
      currentUserId={session?.user.id ?? ''}
    />
  )
}
