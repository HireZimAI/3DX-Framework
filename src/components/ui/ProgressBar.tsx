import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number // 0-100
  className?: string
  barClass?: string
  showLabel?: boolean
}

export function ProgressBar({ value, className, barClass, showLabel = false }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="flex items-center gap-2">
      <div className={cn('flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden', className)}>
        <div
          className={cn('h-full rounded-full transition-all', barClass ?? 'bg-violet-500')}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-500 w-8 text-right">{clamped}%</span>
      )}
    </div>
  )
}
