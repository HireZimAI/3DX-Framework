import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { addDays } from 'date-fns'
import { PhaseType } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId')
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}

  if (session.user.role === 'CLIENT') {
    if (!session.user.clientId) return NextResponse.json([])
    where.clientId = session.user.clientId
  } else if (clientId) {
    where.clientId = clientId
  }

  if (status) where.status = status

  const projects = await prisma.project.findMany({
    where,
    include: {
      client: { select: { id: true, name: true, company: true } },
      podLead: { select: { id: true, name: true } },
      phases: { orderBy: { order: 'asc' } },
      _count: { select: { comments: true, changeRequests: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !['ADMIN', 'POD_LEAD'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    name, description, clientId, podLeadId,
    startDate, targetEndDate, priority, notes,
    phases: phaseDurations,
  } = body

  const start = new Date(startDate)
  const defaultDurations = phaseDurations ?? [14, 21, 28, 21]
  const phaseTypes: PhaseType[] = [PhaseType.DIAGNOSE, PhaseType.DESIGN, PhaseType.DEPLOY, PhaseType.EXECUTE]
  const phaseNames = ['Diagnose', 'Design', 'Deploy', 'Execute']

  let cursor = start
  const phasesData = phaseTypes.map((type, i) => {
    const duration = defaultDurations[i] ?? 14
    const plannedStart = cursor
    const plannedEnd = addDays(cursor, duration)
    cursor = plannedEnd
    return {
      type,
      name: phaseNames[i],
      order: i + 1,
      durationDays: duration,
      plannedStartDate: plannedStart,
      plannedEndDate: plannedEnd,
    }
  })

  const project = await prisma.project.create({
    data: {
      name,
      description,
      clientId,
      podLeadId,
      startDate: start,
      targetEndDate: new Date(targetEndDate),
      priority,
      notes,
      phases: { create: phasesData },
    },
    include: {
      client: true,
      podLead: true,
      phases: { orderBy: { order: 'asc' } },
    },
  })

  return NextResponse.json(project, { status: 201 })
}
