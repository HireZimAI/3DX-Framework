import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { addDays } from 'date-fns'
import { computeShiftedDates } from '@/lib/utils'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !['ADMIN', 'POD_LEAD'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: projectId } = await params
  const body = await req.json()
  const { title, description, reason, daysAdded, impactedPhaseIds, triggerPhaseId } = body

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { phases: { orderBy: { order: 'asc' } } },
  })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const newProjectedCompletion = addDays(project.targetEndDate, daysAdded ?? 0)

  // Create change request
  const cr = await prisma.changeRequest.create({
    data: {
      title,
      description,
      reason,
      daysAdded: daysAdded ?? 0,
      newProjectedCompletion,
      projectId,
      createdById: session.user.id,
      impactedPhases: impactedPhaseIds?.length
        ? { connect: impactedPhaseIds.map((id: string) => ({ id })) }
        : undefined,
    },
    include: {
      createdBy: { select: { name: true } },
      impactedPhases: { select: { id: true, name: true, type: true } },
    },
  })

  // Auto-shift downstream phases if trigger phase given and days > 0
  if (triggerPhaseId && daysAdded && daysAdded !== 0) {
    const triggerPhase = project.phases.find(p => p.id === triggerPhaseId)
    if (triggerPhase) {
      const downstream = computeShiftedDates(project.phases, triggerPhase.order, daysAdded)
      await Promise.all(
        downstream.map(({ id, plannedStartDate, plannedEndDate }) =>
          prisma.phase.update({ where: { id }, data: { plannedStartDate, plannedEndDate } })
        )
      )
    }
  }

  // Update project target end date and status if at risk
  await prisma.project.update({
    where: { id: projectId },
    data: {
      targetEndDate: newProjectedCompletion,
      status: daysAdded > 0 ? 'AT_RISK' : undefined,
    },
  })

  return NextResponse.json(cr, { status: 201 })
}
