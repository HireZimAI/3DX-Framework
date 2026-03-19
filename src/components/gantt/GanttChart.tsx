'use client'

import { useMemo } from 'react'
import { differenceInDays, addDays, format, startOfDay, min, max } from 'date-fns'
import { cn, getPhaseBarColor, getStatusDot } from '@/lib/utils'
import { PhaseType, PhaseStatus } from '@prisma/client'

interface Phase {
  id: string
  type: PhaseType
  name: string
  status: PhaseStatus
  plannedStartDate: Date | string
  plannedEndDate: Date | string
  actualStartDate?: Date | string | null
  actualEndDate?: Date | string | null
}

interface Project {
  id: string
  name: string
  status: string
  client: { company: string }
  phases: Phase[]
}

interface GanttChartProps {
  projects: Project[]
}

const PHASE_COLORS: Record<PhaseType, string> = {
  DIAGNOSE: 'bg-purple-400',
  DESIGN: 'bg-blue-400',
  DEPLOY: 'bg-orange-400',
  EXECUTE: 'bg-green-400',
}

const PHASE_LABEL_COLORS: Record<PhaseType, string> = {
  DIAGNOSE: 'text-purple-700',
  DESIGN: 'text-blue-700',
  DEPLOY: 'text-orange-700',
  EXECUTE: 'text-green-700',
}

export function GanttChart({ projects }: GanttChartProps) {
  const { startDate, totalDays, weeks } = useMemo(() => {
    const allDates = projects.flatMap(p =>
      p.phases.flatMap(ph => [
        new Date(ph.plannedStartDate),
        new Date(ph.plannedEndDate),
      ])
    )
    if (allDates.length === 0) return { startDate: new Date(), totalDays: 30, weeks: [] }

    const minDate = startOfDay(min(allDates))
    const maxDate = max(allDates)
    const totalDays = Math.max(differenceInDays(maxDate, minDate) + 7, 30)

    const weeks: Date[] = []
    for (let i = 0; i <= totalDays; i += 7) {
      weeks.push(addDays(minDate, i))
    }

    return { startDate: minDate, totalDays, weeks }
  }, [projects])

  const today = startOfDay(new Date())
  const todayOffset = differenceInDays(today, startDate)
  const todayPct = (todayOffset / totalDays) * 100

  function pct(date: Date | string) {
    const d = startOfDay(new Date(date))
    const offset = differenceInDays(d, startDate)
    return Math.max(0, (offset / totalDays) * 100)
  }

  function width(start: Date | string, end: Date | string) {
    const s = startOfDay(new Date(start))
    const e = startOfDay(new Date(end))
    const days = Math.max(1, differenceInDays(e, s))
    return (days / totalDays) * 100
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">No projects to display.</div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: `${Math.max(800, totalDays * 12)}px` }}>
        {/* Header – week labels */}
        <div className="flex border-b border-slate-200 mb-1 pb-1">
          <div className="w-64 flex-shrink-0" />
          <div className="flex-1 relative h-6">
            {weeks.map((w, i) => (
              <div
                key={i}
                className="absolute top-0 text-[10px] text-slate-400 whitespace-nowrap"
                style={{ left: `${pct(w)}%` }}
              >
                {format(w, 'MMM d')}
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        {projects.map(project => (
          <div key={project.id} className="mb-4">
            {/* Project label */}
            <div className="flex items-center gap-3 mb-1">
              <div className="w-64 flex-shrink-0 pr-4">
                <p className="text-sm font-medium text-slate-800 truncate">{project.name}</p>
                <p className="text-xs text-slate-400 truncate">{project.client.company}</p>
              </div>
              <div className="flex-1 relative h-2">
                <div className="absolute inset-0 bg-slate-50 rounded" />
              </div>
            </div>

            {/* Phases */}
            {project.phases
              .sort((a, b) => {
                const order = ['DIAGNOSE', 'DESIGN', 'DEPLOY', 'EXECUTE']
                return order.indexOf(a.type) - order.indexOf(b.type)
              })
              .map(phase => {
                const barStart = pct(phase.plannedStartDate)
                const barWidth = width(phase.plannedStartDate, phase.plannedEndDate)
                const isComplete = phase.status === 'COMPLETE'
                const isBlocked = phase.status === 'BLOCKED'

                return (
                  <div key={phase.id} className="flex items-center gap-3 mb-0.5">
                    <div className="w-64 flex-shrink-0 pr-4">
                      <p className={cn('text-xs pl-4', PHASE_LABEL_COLORS[phase.type])}>
                        {phase.name}
                      </p>
                    </div>
                    <div className="flex-1 relative h-5">
                      {/* Grid lines */}
                      {weeks.map((w, i) => (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 border-l border-slate-100"
                          style={{ left: `${pct(w)}%` }}
                        />
                      ))}

                      {/* Today line */}
                      {todayPct >= 0 && todayPct <= 100 && (
                        <div
                          className="absolute top-0 bottom-0 border-l-2 border-red-400 z-10"
                          style={{ left: `${todayPct}%` }}
                        />
                      )}

                      {/* Phase bar */}
                      <div
                        className={cn(
                          'absolute top-1 bottom-1 rounded',
                          isBlocked ? 'bg-red-300' :
                          isComplete ? `${PHASE_COLORS[phase.type]} opacity-100` :
                          `${PHASE_COLORS[phase.type]} opacity-50`,
                        )}
                        style={{ left: `${barStart}%`, width: `${barWidth}%` }}
                        title={`${phase.name}: ${format(new Date(phase.plannedStartDate), 'MMM d')} – ${format(new Date(phase.plannedEndDate), 'MMM d')}`}
                      />

                      {/* Actual bar overlay */}
                      {phase.actualStartDate && (
                        <div
                          className={cn(
                            'absolute top-2 bottom-2 rounded opacity-80',
                            PHASE_COLORS[phase.type],
                          )}
                          style={{
                            left: `${pct(phase.actualStartDate)}%`,
                            width: `${width(phase.actualStartDate, phase.actualEndDate ?? new Date())}%`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 pl-64">
          {(['DIAGNOSE', 'DESIGN', 'DEPLOY', 'EXECUTE'] as PhaseType[]).map(t => (
            <div key={t} className="flex items-center gap-1.5">
              <div className={cn('w-3 h-2 rounded-sm', PHASE_COLORS[t])} />
              <span className="text-xs text-slate-500">{t.charAt(0) + t.slice(1).toLowerCase()}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-px h-4 border-l-2 border-red-400" />
            <span className="text-xs text-slate-500">Today</span>
          </div>
        </div>
      </div>
    </div>
  )
}
