import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role === 'CLIENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clients = await prisma.client.findMany({
    include: {
      projects: { select: { id: true, name: true, status: true, progress: true } },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(clients)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !['ADMIN', 'POD_LEAD'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, company, email, phone, industry, notes } = body

  const client = await prisma.client.create({
    data: { name, company, email, phone, industry, notes },
  })

  return NextResponse.json(client, { status: 201 })
}
