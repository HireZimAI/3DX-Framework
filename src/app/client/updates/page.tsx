import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { MessageSquare, AlertTriangle } from 'lucide-react'

export default async function ClientUpdatesPage() {
  const session = await auth()
  if (!session || !session.user.clientId) redirect('/login')

  const [comments, changeRequests] = await Promise.all([
    prisma.comment.findMany({
      where: {
        isInternal: false,
        project: { clientId: session.user.clientId },
      },
      include: {
        project: { select: { id: true, name: true } },
        author: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.changeRequest.findMany({
      where: { project: { clientId: session.user.clientId } },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
        impactedPhases: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  // Merge and sort
  type FeedItem =
    | { type: 'comment'; date: Date; id: string; projectId: string; projectName: string; content: string; author: string }
    | { type: 'change'; date: Date; id: string; projectId: string; projectName: string; title: string; daysAdded: number; reason: string; phases: string[] }

  const feed: FeedItem[] = [
    ...comments.map(c => ({
      type: 'comment' as const,
      date: new Date(c.createdAt),
      id: c.id,
      projectId: c.project.id,
      projectName: c.project.name,
      content: c.content,
      author: c.author.name,
    })),
    ...changeRequests.map(cr => ({
      type: 'change' as const,
      date: new Date(cr.createdAt),
      id: cr.id,
      projectId: cr.project.id,
      projectName: cr.project.name,
      title: cr.title,
      daysAdded: cr.daysAdded,
      reason: cr.reason,
      phases: cr.impactedPhases.map(p => p.name),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Project Updates</h1>
        <p className="text-slate-500 text-sm mt-0.5">All updates, changes and notes from your delivery team</p>
      </div>

      {feed.length === 0 ? (
        <p className="text-slate-400 text-sm">No updates yet.</p>
      ) : (
        <div className="space-y-3">
          {feed.map(item => (
            <Link
              key={`${item.type}-${item.id}`}
              href={`/client/projects/${item.projectId}`}
              className="block bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-4 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  item.type === 'change' ? 'bg-orange-100' : 'bg-blue-50'
                }`}>
                  {item.type === 'change'
                    ? <AlertTriangle className="w-4 h-4 text-orange-500" />
                    : <MessageSquare className="w-4 h-4 text-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-semibold text-slate-500 truncate">{item.projectName}</p>
                    <p className="text-xs text-slate-400 flex-shrink-0">{formatDate(item.date)}</p>
                  </div>
                  {item.type === 'comment' ? (
                    <>
                      <p className="text-sm text-slate-800">{item.content}</p>
                      <p className="text-xs text-slate-400 mt-1">{item.author}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.reason}</p>
                      {item.daysAdded !== 0 && (
                        <span className="text-xs text-orange-600 font-medium">
                          {item.daysAdded > 0 ? `+${item.daysAdded} days` : `${item.daysAdded} days`}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
