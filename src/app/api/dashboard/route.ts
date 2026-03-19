import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { addDays, startOfDay, endOfDay } from 'date-fns'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isClient = session.user.role === 'CLIENT'
  const clientFilter = isClient ? { clientId: session.user.clientId! } : {}

  const [active, completed, atRisk, onHold, projects] = await Promise.all([
    prisma.project.count({ where: { ...clientFilter, status: 'ACTIVE' } }),
    prisma.project.count({ where: { ...clientFilter, status: 'COMPLETED' } }),
    prisma.project.count({ where: { ...clientFilter, status: 'AT_RISK' } }),
    prisma.project.count({ where: { ...clientFilter, status: 'ON_HOLD' } }),
    prisma.project.findMany({
      where: {
        ...clientFilter,
        status: { not: 'COMPLETED' },
        targetEndDate: {
          lte: endOfDay(addDays(new Date(), 14)),
          gte: startOfDay(new Date()),
        },
      },
      include: { client: { select: { name: true, company: true } } },
      orderBy: { targetEndDate: 'asc' },
      take: 5,
    }),
  ])

  return NextResponse.json({ active, completed, atRisk, onHold, upcomingDeadlines: projects })
}
