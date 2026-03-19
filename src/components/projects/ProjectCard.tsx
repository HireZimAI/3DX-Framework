import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import {
  cn, formatDate, getStatusColor, getPriorityColor,
  getPhaseColor, labelForStatus, getDaysRemaining
} from '@/lib/utils'
import { PhaseType, ProjectStatus } from '@prisma/client'
import { Calendar, User, AlertCircle } from 'lucide-react'

interface Phase {
  type: PhaseType
  status: string
  name: string
}

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description?: string | null
    status: ProjectStatus
    priority: string
    progress: number
    startDate: Date | string
    targetEndDate: Date | string
    client: { name: string; company: string }
    podLead?: { name: string } | null
    phases: Phase[]
  }
  basePath?: string
  showClient?: boolean
}

const PHASE_ORDER: PhaseType[] = ['DIAGNOSE', 'DESIGN', 'DEPLOY', 'EXECUTE']

export function ProjectCard({ project, basePath = '/admin', showClient = true }: ProjectCardProps) {
  const daysLeft = getDaysRemaining(project.targetEndDate)
  const currentPhase = project.phases
    .sort((a, b) => PHASE_ORDER.indexOf(a.type) - PHASE_ORDER.indexOf(b.type))
    .findLast(p => p.status === 'IN_PROGRESS' || p.status === 'COMPLETE') ?? project.phases[0]

  const isAtRisk = project.status === 'AT_RISK' || (daysLeft < 7 && project.status === 'ACTIVE')

  return (
    <Link
      href={`${basePath}/projects/${project.id}`}
      className="block bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            {showClient && (
              <p className="text-xs text-slate-400 font-medium mb-0.5 truncate">{project.client.company}</p>
            )}
            <h3 className="font-semibold text-slate-900 group-hover:text-violet-700 transition-colors truncate">
              {project.name}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={getPriorityColor(project.priority as never)}>
              {project.priority}
            </Badge>
            <Badge className={getStatusColor(project.status)}>
              {labelForStatus(project.status)}
            </Badge>
          </div>
        </div>

        {project.description && (
          <p className="text-sm text-slate-500 mb-3 line-clamp-2">{project.description}</p>
        )}

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Progress</span>
            <span className="font-medium text-slate-700">{project.progress}%</span>
          </div>
          <ProgressBar
            value={project.progress}
            barClass={
              project.status === 'COMPLETED' ? 'bg-green-500' :
              isAtRisk ? 'bg-red-500' : 'bg-violet-500'
            }
          />
        </div>

        {/* Phase Indicators */}
        <div className="flex gap-1 mb-3">
          {PHASE_ORDER.map(type => {
            const phase = project.phases.find(p => p.type === type)
            const isComplete = phase?.status === 'COMPLETE'
            const isActive = phase?.status === 'IN_PROGRESS'
            const isBlocked = phase?.status === 'BLOCKED'
            return (
              <div
                key={type}
                className={cn(
                  'h-1.5 flex-1 rounded-full',
                  isComplete ? getPhaseColor(type) :
                  isActive ? `${getPhaseColor(type)} opacity-60` :
                  isBlocked ? 'bg-red-400' :
                  'bg-slate-100'
                )}
                title={phase ? `${phase.name}: ${phase.status}` : type}
              />
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Due {formatDate(project.targetEndDate)}</span>
          </div>
          <div className="flex items-center gap-3">
            {project.podLead && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{project.podLead.name.split(' ')[0]}</span>
              </div>
            )}
            {isAtRisk && (
              <div className="flex items-center gap-1 text-red-500">
                <AlertCircle className="w-3 h-3" />
                <span>{daysLeft < 0 ? 'Overdue' : `${daysLeft}d left`}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
