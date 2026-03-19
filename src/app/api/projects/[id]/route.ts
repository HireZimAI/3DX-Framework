import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ProjectStatus } from '@prisma/client'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

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

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Client can only see their own project
  if (session.user.role === 'CLIENT' && project.clientId !== session.user.clientId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(project)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !['ADMIN', 'POD_LEAD'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  // Auto-set completedAt when marking complete
  if (body.status === ProjectStatus.COMPLETED && !body.completedAt) {
    body.completedAt = new Date()
    body.progress = 100
  }

  const project = await prisma.project.update({
    where: { id },
    data: body,
    include: {
      client: true,
      phases: { orderBy: { order: 'asc' } },
    },
  })

  return NextResponse.json(project)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  await prisma.project.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
