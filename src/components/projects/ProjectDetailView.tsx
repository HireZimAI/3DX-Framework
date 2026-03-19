'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import {
  cn, formatDate, getStatusColor, getPriorityColor,
  getPhaseColor, labelForStatus, getDaysRemaining
} from '@/lib/utils'
import {
  ArrowLeft, Calendar, User, CheckCircle2, Circle,
  AlertTriangle, Clock, MessageSquare, FileText,
  ChevronDown, ChevronUp, Plus, Send, Lock
} from 'lucide-react'
import { PhaseType, PhaseStatus, ProjectStatus } from '@prisma/client'

interface Task { id: string; title: string; completed: boolean; order: number }
interface Phase {
  id: string
  type: PhaseType
  name: string
  order: number
  status: PhaseStatus
  progress: number
  plannedStartDate: Date | string
  plannedEndDate: Date | string
  actualStartDate?: Date | string | null
  actualEndDate?: Date | string | null
  deliverables?: string | null
  clientDependencies?: string | null
  internalNotes?: string | null
  clientNotes?: string | null
  durationDays: number
  tasks: Task[]
}
interface Comment {
  id: string
  content: string
  isInternal: boolean
  createdAt: Date | string
  author: { name: string; role: string }
}
interface ChangeRequest {
  id: string
  title: string
  description: string
  reason: string
  daysAdded: number
  dateOfChange: Date | string
  newProjectedCompletion?: Date | string | null
  createdBy: { name: string }
  impactedPhases: { id: string; name: string; type: string }[]
}
interface Project {
  id: string
  name: string
  description?: string | null
  status: ProjectStatus
  priority: string
  progress: number
  startDate: Date | string
  targetEndDate: Date | string
  actualEndDate?: Date | string | null
  completedAt?: Date | string | null
  notes?: string | null
  client: { id: string; name: string; company: string }
  podLead?: { id: string; name: string; email: string } | null
  phases: Phase[]
  comments: Comment[]
  changeRequests: ChangeRequest[]
}

const PHASE_COLORS: Record<PhaseType, string> = {
  DIAGNOSE: 'border-purple-200 bg-purple-50',
  DESIGN: 'border-blue-200 bg-blue-50',
  DEPLOY: 'border-orange-200 bg-orange-50',
  EXECUTE: 'border-green-200 bg-green-50',
}

const PHASE_PROGRESS_COLORS: Record<PhaseType, string> = {
  DIAGNOSE: 'bg-purple-500',
  DESIGN: 'bg-blue-500',
  DEPLOY: 'bg-orange-500',
  EXECUTE: 'bg-green-500',
}

const STATUS_LABELS: Record<PhaseStatus, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  COMPLETE: 'Complete',
}

export function ProjectDetailView({
  project,
  isInternal,
  currentUserId,
}: {
  project: Project
  isInternal: boolean
  currentUserId: string
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'phases' | 'changes' | 'comments'>('overview')
  const [expandedPhase, setExpandedPhase] = useState<string | null>(project.phases.find(p => p.status === 'IN_PROGRESS')?.id ?? null)
  const [newComment, setNewComment] = useState('')
  const [isIntComment, setIsIntComment] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [comments, setComments] = useState(project.comments)

  const backPath = isInternal ? '/admin/projects' : '/client/projects'
  const daysLeft = getDaysRemaining(project.targetEndDate)
  const currentPhase = project.phases.find(p => p.status === 'IN_PROGRESS') ?? project.phases[0]

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)

    const res = await fetch(`/api/projects/${project.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment, isInternal: isIntComment }),
    })

    if (res.ok) {
      const c = await res.json()
      setComments(prev => [c, ...prev])
      setNewComment('')
    }
    setSubmitting(false)
  }

  const visibleComments = isInternal ? comments : comments.filter(c => !c.isInternal)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Back */}
      <Link
        href={backPath}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to projects
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-slate-400">{project.client.company}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
            {project.description && (
              <p className="text-slate-500 mt-1 text-sm max-w-2xl">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={getPriorityColor(project.priority as never)}>{project.priority}</Badge>
            <Badge className={getStatusColor(project.status)}>{labelForStatus(project.status)}</Badge>
            {project.status === 'COMPLETED' && (
              <span className="text-xs text-slate-400">
                Completed {formatDate(project.completedAt ?? project.actualEndDate)}
              </span>
            )}
          </div>
        </div>

        {/* Meta bar */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-300" />
            <span>{formatDate(project.startDate)} → {formatDate(project.targetEndDate)}</span>
          </div>
          {project.podLead && (
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-300" />
              <span>{project.podLead.name}</span>
            </div>
          )}
          {project.status !== 'COMPLETED' && (
            <div className={cn('flex items-center gap-1.5', daysLeft < 7 ? 'text-red-500' : '')}>
              <Clock className="w-4 h-4" />
              <span>{daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d remaining`}</span>
            </div>
          )}
        </div>

        {/* Overall progress */}
        <div className="mt-4 flex items-center gap-3">
          <ProgressBar
            value={project.progress}
            className="flex-1 h-2"
            barClass={project.status === 'COMPLETED' ? 'bg-green-500' : project.status === 'AT_RISK' ? 'bg-red-500' : 'bg-violet-500'}
          />
          <span className="text-sm font-semibold text-slate-700">{project.progress}%</span>
        </div>
      </div>

      {/* Phase Pipeline */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
        {project.phases.map(phase => {
          const isActive = phase.status === 'IN_PROGRESS'
          const isDone = phase.status === 'COMPLETE'
          const isBlocked = phase.status === 'BLOCKED'
          return (
            <button
              key={phase.id}
              onClick={() => { setActiveTab('phases'); setExpandedPhase(phase.id) }}
              className={cn(
                'flex-1 min-w-[120px] p-3 rounded-xl border-2 text-left transition-all',
                isBlocked ? 'border-red-300 bg-red-50' :
                isDone ? `${PHASE_COLORS[phase.type]} opacity-90` :
                isActive ? PHASE_COLORS[phase.type] :
                'border-slate-100 bg-slate-50 opacity-60'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-500">{phase.name}</span>
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                ) : isBlocked ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-300" />
                )}
              </div>
              <p className="text-[10px] text-slate-400">{STATUS_LABELS[phase.status]}</p>
              <div className="mt-2 h-1 bg-white/60 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full', PHASE_PROGRESS_COLORS[phase.type])}
                  style={{ width: `${phase.progress}%` }}
                />
              </div>
            </button>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {[
          { id: 'overview', label: 'Overview', icon: FileText },
          { id: 'phases', label: 'Phases', icon: CheckCircle2 },
          { id: 'changes', label: `Changes (${project.changeRequests.length})`, icon: AlertTriangle },
          { id: 'comments', label: `Updates (${visibleComments.length})`, icon: MessageSquare },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === tab.id
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Current Status */}
            {currentPhase && (
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-slate-800">Current Phase</h3>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className={cn('w-3 h-3 rounded-full mt-1 flex-shrink-0', getPhaseColor(currentPhase.type))} />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{currentPhase.name}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {formatDate(currentPhase.plannedStartDate)} → {formatDate(currentPhase.plannedEndDate)}
                      </p>
                      {currentPhase.clientNotes && (
                        <p className="text-sm text-slate-600 mt-2 p-3 bg-slate-50 rounded-lg">
                          {currentPhase.clientNotes}
                        </p>
                      )}
                      {currentPhase.clientDependencies && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-xs font-semibold text-amber-700 mb-1">Required from you:</p>
                          <p className="text-sm text-amber-800">{currentPhase.clientDependencies}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isInternal && project.notes && (
              <Card>
                <CardHeader><h3 className="font-semibold text-slate-800">Internal Notes</h3></CardHeader>
                <CardContent><p className="text-sm text-slate-600">{project.notes}</p></CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><h3 className="font-semibold text-slate-800 text-sm">Project Details</h3></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Client</span>
                  <span className="font-medium text-slate-800">{project.client.company}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Pod Lead</span>
                  <span className="font-medium text-slate-800">{project.podLead?.name ?? '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Start</span>
                  <span className="font-medium text-slate-800">{formatDate(project.startDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Target End</span>
                  <span className="font-medium text-slate-800">{formatDate(project.targetEndDate)}</span>
                </div>
                {project.changeRequests.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Days Added</span>
                    <span className="font-medium text-orange-600">
                      +{project.changeRequests.reduce((sum, cr) => sum + cr.daysAdded, 0)}d
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'phases' && (
        <div className="space-y-3">
          {project.phases.map(phase => (
            <PhaseAccordion
              key={phase.id}
              phase={phase}
              isOpen={expandedPhase === phase.id}
              onToggle={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
              isInternal={isInternal}
              projectId={project.id}
            />
          ))}
        </div>
      )}

      {activeTab === 'changes' && (
        <div className="space-y-4">
          {project.changeRequests.length === 0 ? (
            <p className="text-slate-400 text-sm">No change requests logged yet.</p>
          ) : (
            project.changeRequests.map(cr => (
              <Card key={cr.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <h4 className="font-semibold text-slate-800">{cr.title}</h4>
                        {cr.daysAdded > 0 && (
                          <Badge className="bg-orange-100 text-orange-700">+{cr.daysAdded} days</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{cr.description}</p>
                      <p className="text-xs text-slate-400">
                        <strong>Reason:</strong> {cr.reason}
                      </p>
                      {cr.impactedPhases.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {cr.impactedPhases.map(p => (
                            <Badge key={p.id} className="bg-slate-100 text-slate-600 text-[10px]">{p.name}</Badge>
                          ))}
                        </div>
                      )}
                      {cr.newProjectedCompletion && (
                        <p className="text-xs text-slate-500 mt-2">
                          New projected completion: <strong>{formatDate(cr.newProjectedCompletion)}</strong>
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-400">{formatDate(cr.dateOfChange)}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{cr.createdBy.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="space-y-4">
          {/* New comment form */}
          <Card>
            <CardContent className="py-4">
              <form onSubmit={submitComment} className="space-y-3">
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add an update or note..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm resize-none h-20 focus:outline-none focus:border-violet-400"
                />
                <div className="flex items-center justify-between">
                  {isInternal && (
                    <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isIntComment}
                        onChange={e => setIsIntComment(e.target.checked)}
                        className="rounded"
                      />
                      <Lock className="w-3 h-3" />
                      Internal only
                    </label>
                  )}
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submitting ? 'Posting...' : 'Post Update'}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          {visibleComments.map(comment => (
            <div key={comment.id} className={cn('p-4 rounded-xl border', comment.isInternal ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200')}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                    <span className="text-violet-700 text-xs font-medium">{comment.author.name.charAt(0)}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-700">{comment.author.name}</span>
                  {comment.isInternal && (
                    <Badge className="bg-amber-100 text-amber-700 text-[10px]">
                      <Lock className="w-2.5 h-2.5" /> Internal
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-slate-400">{formatDate(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-600">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PhaseAccordion({
  phase, isOpen, onToggle, isInternal, projectId
}: {
  phase: Phase
  isOpen: boolean
  onToggle: () => void
  isInternal: boolean
  projectId: string
}) {
  const completedTasks = phase.tasks.filter(t => t.completed).length
  const isBlocked = phase.status === 'BLOCKED'

  return (
    <div className={cn(
      'rounded-xl border-2 overflow-hidden transition-all',
      isBlocked ? 'border-red-300' : PHASE_COLORS[phase.type]
    )}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-black/5 transition-colors"
      >
        <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', getPhaseColor(phase.type))} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{phase.name}</span>
            <Badge className={
              phase.status === 'COMPLETE' ? 'bg-green-100 text-green-700' :
              phase.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
              phase.status === 'BLOCKED' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-600'
            }>
              {STATUS_LABELS[phase.status]}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {formatDate(phase.plannedStartDate)} → {formatDate(phase.plannedEndDate)}
            {phase.tasks.length > 0 && ` · ${completedTasks}/${phase.tasks.length} tasks`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProgressBar value={phase.progress} className="w-20" barClass={PHASE_PROGRESS_COLORS[phase.type]} />
          <span className="text-xs font-medium text-slate-500 w-8">{phase.progress}%</span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-current/10 p-4 space-y-4 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dates */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Planned Start</span>
                <span className="font-medium">{formatDate(phase.plannedStartDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Planned End</span>
                <span className="font-medium">{formatDate(phase.plannedEndDate)}</span>
              </div>
              {phase.actualStartDate && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Actual Start</span>
                  <span className="font-medium">{formatDate(phase.actualStartDate)}</span>
                </div>
              )}
              {phase.actualEndDate && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Actual End</span>
                  <span className="font-medium">{formatDate(phase.actualEndDate)}</span>
                </div>
              )}
            </div>

            {/* Tasks */}
            {phase.tasks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tasks</p>
                <div className="space-y-1.5">
                  {phase.tasks.map(task => (
                    <div key={task.id} className="flex items-center gap-2">
                      {task.completed
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        : <Circle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
                      <span className={cn('text-sm', task.completed ? 'line-through text-slate-400' : 'text-slate-700')}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Client-facing notes */}
          {phase.clientNotes && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs font-semibold text-slate-500 mb-1">Update for Client</p>
              <p className="text-sm text-slate-700">{phase.clientNotes}</p>
            </div>
          )}

          {/* Client dependencies */}
          {phase.clientDependencies && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-700 mb-1">Required from Client</p>
              <p className="text-sm text-amber-800">{phase.clientDependencies}</p>
            </div>
          )}

          {/* Internal notes — only for internal users */}
          {isInternal && phase.internalNotes && (
            <div className="p-3 bg-slate-900 rounded-lg">
              <p className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Internal Notes
              </p>
              <p className="text-sm text-slate-300">{phase.internalNotes}</p>
            </div>
          )}

          {/* Deliverables */}
          {phase.deliverables && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Deliverables</p>
              <p className="text-sm text-slate-600">{phase.deliverables}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
