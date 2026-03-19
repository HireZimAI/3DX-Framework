import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { computeShiftedDates } from '@/lib/utils'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !['ADMIN', 'POD_LEAD'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: projectId } = await params
  const body = await req.json()
  const { phaseId, shiftDays, ...phaseData } = body

  // Get all phases for rescheduling
  const allPhases = await prisma.phase.findMany({ where: { projectId } })

  const targetPhase = allPhases.find(p => p.id === phaseId)
  if (!targetPhase) return NextResponse.json({ error: 'Phase not found' }, { status: 404 })

  // Update target phase
  const updatedPhase = await prisma.phase.update({
    where: { id: phaseId },
    data: phaseData,
  })

  // If shiftDays provided, cascade downstream phases
  if (shiftDays && shiftDays !== 0) {
    const downstream = computeShiftedDates(allPhases, targetPhase.order, shiftDays)
    await Promise.all(
      downstream.map(({ id, plannedStartDate, plannedEndDate }) =>
        prisma.phase.update({ where: { id }, data: { plannedStartDate, plannedEndDate } })
      )
    )

    // Update project target end date if last phase changed
    const lastPhase = allPhases.find(p => p.order === Math.max(...allPhases.map(x => x.order)))
    if (lastPhase && downstream.find(d => d.id === lastPhase.id)) {
      const newEnd = downstream.find(d => d.id === lastPhase.id)?.plannedEndDate
      if (newEnd) {
        await prisma.project.update({
          where: { id: projectId },
          data: { targetEndDate: newEnd },
        })
      }
    }
  }

  return NextResponse.json(updatedPhase)
}
