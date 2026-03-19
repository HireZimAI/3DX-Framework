import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  iconClass?: string
  trend?: string
}

export function StatCard({ label, value, icon: Icon, iconClass, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          {trend && <p className="text-xs text-slate-400 mt-1">{trend}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconClass ?? 'bg-slate-100')}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
