import { formatCount } from '@/utils/formatterNumber'

export function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-card rounded-2xl p-4 transition hover:-translate-y-0.5">
      <p className="text-2xl font-black tabular-nums tracking-tight text-slate-900 sm:text-3xl">
        {formatCount(value)}
      </p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  )
}