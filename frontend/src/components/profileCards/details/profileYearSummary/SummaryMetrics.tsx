import type { LucideIcon } from 'lucide-react'

interface DealMetricProps {
  amount: string
  count: number
  icon: LucideIcon
  label: string
  tone: 'blue' | 'purple'
}

export function DealMetric({ amount, count, icon: Icon, label, tone }: DealMetricProps) {
  const styles =
    tone === 'blue'
      ? { background: 'bg-[#e8f6ff]', icon: 'text-[#00aaff]' }
      : { background: 'bg-[#f1eafd]', icon: 'text-[#965eeb]' }

  return (
    <div className={`rounded-2xl p-3.5 ${styles.background}`}>
      <p className="flex items-center gap-1.5 text-xs font-medium text-[#6f7377]">
        <Icon aria-hidden="true" className={`size-4 ${styles.icon}`} />
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-2xl font-bold leading-none text-[#1f1f1f]">{count}</p>
        <p className="text-right text-xs font-semibold text-[#1f1f1f]">{amount}</p>
      </div>
      <p className="mt-1 text-[11px] text-[#6f7377]">за год</p>
    </div>
  )
}

interface TopActivityProps {
  icon: LucideIcon
  label: string
  title: string
  tone: 'blue' | 'purple'
  value: string
}

export function TopActivity({ icon: Icon, label, title, tone, value }: TopActivityProps) {
  const iconColor = tone === 'blue' ? 'text-[#00aaff]' : 'text-[#965eeb]'

  return (
    <div className="min-w-0 rounded-2xl border border-[#eceeef] bg-[#fafafa] p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-[#8a8d91]">
        <Icon aria-hidden="true" className={`size-3.5 ${iconColor}`} />
        {label}
      </p>
      <p className="mt-1.5 truncate text-sm font-bold text-[#1f1f1f]" title={title}>
        {title}
      </p>
      <p className="mt-1 text-sm font-semibold text-[#1f1f1f]">{value}</p>
    </div>
  )
}

interface SmallMetricProps {
  icon: LucideIcon
  label: string
  value: number | string
}

export function SmallMetric({ icon: Icon, label, value }: SmallMetricProps) {
  return (
    <div className="min-w-0 border-r border-[#eceeef] px-2 text-center last:border-r-0">
      <p className="flex items-center justify-center gap-1 text-[10px] text-[#8a8d91]">
        <Icon aria-hidden="true" className="size-3 text-[#00aaff]" />
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-bold text-[#1f1f1f]" title={`${value}`}>
        {value}
      </p>
    </div>
  )
}
