import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, addDays, differenceInDays } from 'date-fns'
import { PhaseStatus, ProjectStatus, Priority } from '@prisma/client'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'MMM d')
}

export function getDaysRemaining(targetDate: Date | string): number {
  return differenceInDays(new Date(targetDate), new Date())
}

export function getStatusColor(status: ProjectStatus | PhaseStatus): string {
  const map: Record<string, string> = {
    ACTIVE: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    ON_HOLD: 'bg-gray-100 text-gray-700',
    AT_RISK: 'bg-red-100 text-red-800',
    NOT_STARTED: 'bg-gray-100 text-gray-600',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    BLOCKED: 'bg-red-100 text-red-700',
    COMPLETE: 'bg-green-100 text-green-700',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

export function getStatusDot(status: ProjectStatus | PhaseStatus): string {
  const map: Record<string, string> = {
    ACTIVE: 'bg-blue-500',
    COMPLETED: 'bg-green-500',
    ON_HOLD: 'bg-gray-400',
    AT_RISK: 'bg-red-500',
    NOT_STARTED: 'bg-gray-300',
    IN_PROGRESS: 'bg-blue-400',
    BLOCKED: 'bg-red-500',
    COMPLETE: 'bg-green-500',
  }
  return map[status] ?? 'bg-gray-300'
}

export function getPriorityColor(priority: Priority): string {
  const map: Record<Priority, string> = {
    LOW: 'bg-gray-100 text-gray-600',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    HIGH: 'bg-orange-100 text-orange-700',
    CRITICAL: 'bg-red-100 text-red-700',
  }
  return map[priority]
}

export function getPhaseColor(type: string): string {
  const map: Record<string, string> = {
    DIAGNOSE: 'bg-purple-500',
    DESIGN: 'bg-blue-500',
    DEPLOY: 'bg-orange-500',
    EXECUTE: 'bg-green-500',
  }
  return map[type] ?? 'bg-gray-400'
}

export function getPhaseBarColor(type: string): string {
  const map: Record<string, string> = {
    DIAGNOSE: 'bg-purple-400',
    DESIGN: 'bg-blue-400',
    DEPLOY: 'bg-orange-400',
    EXECUTE: 'bg-green-400',
  }
  return map[type] ?? 'bg-gray-400'
}

export function labelForStatus(status: string): string {
  return status.replace(/_/g, ' ')
}

export function labelForPhaseType(type: string): string {
  return type.charAt(0) + type.slice(1).toLowerCase()
}

/**
 * Rescheduling engine: shift all phases after a given phase index
 * by a number of days, unless they have isManualOverride set.
 */
export function computeShiftedDates(
  phases: Array<{
    id: string
    order: number
    plannedStartDate: Date
    plannedEndDate: Date
    durationDays: number
    isManualOverride: boolean
  }>,
  triggerPhaseOrder: number,
  shiftDays: number
) {
  const sorted = [...phases].sort((a, b) => a.order - b.order)
  const updates: Array<{ id: string; plannedStartDate: Date; plannedEndDate: Date }> = []

  let cumulativeShift = shiftDays

  for (const phase of sorted) {
    if (phase.order <= triggerPhaseOrder) continue
    if (phase.isManualOverride) continue

    const newStart = addDays(phase.plannedStartDate, cumulativeShift)
    const newEnd = addDays(phase.plannedEndDate, cumulativeShift)
    updates.push({ id: phase.id, plannedStartDate: newStart, plannedEndDate: newEnd })
  }

  return updates
}
