import { prisma } from '@/lib/db'
import { Badge } from '@/components/ui/Badge'
import { getStatusColor, labelForStatus } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Building2, FolderOpen } from 'lucide-react'

export default async function AdminClientsPage() {
  const clients = await prisma.client.findMany({
    include: {
      projects: {
        select: { id: true, name: true, status: true, progress: true },
        orderBy: { updatedAt: 'desc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 text-sm mt-0.5">{clients.length} clients</p>
        </div>
        <Link
          href="/admin/clients/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {clients.map(client => {
          const activeProjects = client.projects.filter(p => p.status !== 'COMPLETED')
          const completedProjects = client.projects.filter(p => p.status === 'COMPLETED')
          const avgProgress = activeProjects.length
            ? Math.round(activeProjects.reduce((sum, p) => sum + p.progress, 0) / activeProjects.length)
            : 0

          return (
            <div key={client.id} className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{client.company}</h3>
                  <p className="text-sm text-slate-500 truncate">{client.name}</p>
                </div>
              </div>

              {client.industry && (
                <p className="text-xs text-slate-400 mb-3">{client.industry}</p>
              )}

              <div className="flex items-center gap-3 text-sm text-slate-500 mb-4">
                <div className="flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>{activeProjects.length} active</span>
                </div>
                <span>·</span>
                <span>{completedProjects.length} completed</span>
              </div>

              {/* Recent projects */}
              {activeProjects.slice(0, 3).map(p => (
                <Link
                  key={p.id}
                  href={`/admin/projects/${p.id}`}
                  className="flex items-center justify-between py-2 border-t border-slate-50 first:border-0 hover:text-violet-600 transition-colors"
                >
                  <span className="text-xs text-slate-600 truncate flex-1">{p.name}</span>
                  <Badge className={`${getStatusColor(p.status as never)} text-[10px] ml-2`}>
                    {labelForStatus(p.status)}
                  </Badge>
                </Link>
              ))}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <Link
                  href={`/admin/projects?clientId=${client.id}`}
                  className="text-xs text-violet-600 hover:text-violet-800 font-medium"
                >
                  View all projects →
                </Link>
                <span className="text-xs text-slate-400">{avgProgress}% avg</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
