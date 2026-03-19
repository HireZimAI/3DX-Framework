import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !['ADMIN', 'POD_LEAD'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: phaseId } = await params
  const { title, order } = await req.json()

  const task = await prisma.task.create({ data: { title, phaseId, order: order ?? 0 } })
  return NextResponse.json(task, { status: 201 })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !['ADMIN', 'POD_LEAD'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: phaseId } = await params
  const { taskId, ...data } = await req.json()

  const task = await prisma.task.update({ where: { id: taskId, phaseId }, data })
  return NextResponse.json(task)
}
