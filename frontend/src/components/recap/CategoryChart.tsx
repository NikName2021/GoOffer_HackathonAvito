import type { CategoryStat } from '@/types/recap.type'

type Props = {
  categories: CategoryStat[]
}

export function CategoryChart({ categories }: Props) {
  if (!categories.length) return null

  const max = Math.max(...categories.map((c) => c.count), 1)

  return (
    <div className="mt-5 space-y-3">
      {categories.slice(0, 5).map((c, i) => {
        const pct = Math.round((c.count / max) * 100)
        return (
          <div key={c.category}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-[#1f1f1f]">
                {i + 1}. {c.category}
              </span>
              <span className="tabular-nums text-[#6f7377]">{c.count}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#eef1f4]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00aaff] to-[#7c3aed] transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}