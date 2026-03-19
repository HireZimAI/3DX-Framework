import { prisma } from '@/lib/db'
import { ProjectCard } from '@/components/projects/ProjectCard'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ProjectStatus } from '@prisma/client'

interface SearchParams {
  status?: string
  clientId?: string
}

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const where: Record<string, unknown> = {}
  if (sp.status) where.status = sp.status
  if (sp.clientId) where.clientId = sp.clientId

  const [projects, clients] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, company: true } },
        podLead: { select: { id: true, name: true } },
        phases: true,
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.client.findMany({ orderBy: { company: 'asc' }, select: { id: true, company: true } }),
  ])

  const statuses: { value: string; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'AT_RISK', label: 'At Risk' },
    { value: 'ON_HOLD', label: 'On Hold' },
    { value: 'COMPLETED', label: 'Completed' },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Projects</h1>
          <p className="text-slate-500 text-sm mt-0.5">{projects.length} projects</p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {statuses.map(s => (
            <Link
              key={s.value}
              href={`/admin/projects?status=${s.value}${sp.clientId ? `&clientId=${sp.clientId}` : ''}`}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                sp.status === s.value || (!sp.status && s.value === '')
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>

        <select
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:border-violet-300"
          defaultValue={sp.clientId ?? ''}
          onChange={(e) => {
            const url = new URL(window.location.href)
            if (e.target.value) url.searchParams.set('clientId', e.target.value)
            else url.searchParams.delete('clientId')
            window.location.href = url.toString()
          }}
        >
          <option value="">All Clients</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.company}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-lg font-medium">No projects found</p>
          <p className="text-sm mt-1">Try adjusting filters or create a new project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} basePath="/admin" />
          ))}
        </div>
      )}
    </div>
  )
}
