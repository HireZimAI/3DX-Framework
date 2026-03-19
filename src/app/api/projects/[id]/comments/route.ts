import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: projectId } = await params
  const { content, isInternal } = await req.json()

  // Clients can only post non-internal comments
  const internal = session.user.role === 'CLIENT' ? false : !!isInternal

  const comment = await prisma.comment.create({
    data: {
      content,
      isInternal: internal,
      projectId,
      authorId: session.user.id,
    },
    include: { author: { select: { name: true, role: true } } },
  })

  return NextResponse.json(comment, { status: 201 })
}
