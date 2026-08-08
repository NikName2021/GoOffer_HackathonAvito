import { formatCount } from '@/utils/formatterNumber'

export function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#e7e9eb] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-2xl font-bold tabular-nums tracking-tight text-[#1f1f1f] sm:text-3xl">
        {formatCount(value)}
      </p>
      <p className="mt-1 text-sm text-[#6f7377]">{label}</p>
    </div>
  )
}