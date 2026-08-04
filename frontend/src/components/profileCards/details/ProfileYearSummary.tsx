import { ArrowDownRight, ArrowUpRight, Eye, Heart, MessageCircle, Star } from 'lucide-react'

import type { GetProfileResponse } from '@/types/profileResponse.type'
import { formatCurrency } from '@/utils/formatterNumber'

interface ProfileYearSummaryProps {
  profile: GetProfileResponse
}

export function ProfileYearSummary({ profile }: ProfileYearSummaryProps) {
  const { highlights, stats } = profile

  return (
    <section className="rounded-3xl border border-[#d8f1ff] bg-[#f5fbff] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#1f1f1f]">Итоги 2026 года</p>
          <p className="mt-0.5 text-xs text-[#6f7377]">{stats.purchasesCount + stats.salesCount} сделок за год</p>
        </div>
        <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#00aaff] shadow-sm">
          {highlights.favoriteCategory ?? 'Новая история'}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <MoneyMetric
          icon={ArrowDownRight}
          label="Потрачено"
          tone="blue"
          value={formatCurrency(stats.totalSpent)}
        />
        <MoneyMetric
          icon={ArrowUpRight}
          label="Заработано"
          tone="purple"
          value={formatCurrency(stats.totalEarned)}
        />
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <TopActivity
          label="Самая дорогая покупка"
          title={highlights.mostExpensivePurchase?.title ?? 'Покупок пока нет'}
          value={
            highlights.mostExpensivePurchase ? formatCurrency(highlights.mostExpensivePurchase.price) : '—'
          }
        />
        <TopActivity
          label="Самая дорогая продажа"
          title={highlights.mostExpensiveSale?.title ?? 'Продаж пока нет'}
          value={highlights.mostExpensiveSale ? formatCurrency(highlights.mostExpensiveSale.price) : '—'}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 border-t border-[#d8edf8] pt-3">
        <SmallMetric icon={Heart} label="Лайки" value={stats.likes} />
        <SmallMetric icon={Eye} label="Просмотры" value={stats.totalViewCount} />
        <SmallMetric
          icon={stats.averageRating === null ? MessageCircle : Star}
          label="Отзывы"
          value={stats.averageRating === null ? stats.reviewsCount : `${stats.averageRating.toFixed(1)} · ${stats.reviewsCount}`}
        />
      </div>
    </section>
  )
}

interface MoneyMetricProps {
  icon: typeof ArrowDownRight
  label: string
  tone: 'blue' | 'purple'
  value: string
}

function MoneyMetric({ icon: Icon, label, tone, value }: MoneyMetricProps) {
  const iconColor = tone === 'blue' ? 'text-[#00aaff]' : 'text-[#965eeb]'

  return (
    <div className="rounded-2xl bg-white p-3">
      <p className="flex items-center gap-1.5 text-xs text-[#6f7377]">
        <Icon aria-hidden="true" className={`size-4 ${iconColor}`} />
        {label}
      </p>
      <p className="mt-1.5 text-base font-bold text-[#1f1f1f]">{value}</p>
    </div>
  )
}

interface TopActivityProps {
  label: string
  title: string
  value: string
}

function TopActivity({ label, title, value }: TopActivityProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#dcecf5] bg-white p-3">
      <p className="text-[11px] font-medium text-[#8a8d91]">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-[#1f1f1f]" title={title}>
        {title}
      </p>
      <p className="mt-1 text-sm font-semibold text-[#1f1f1f]">{value}</p>
    </div>
  )
}

interface SmallMetricProps {
  icon: typeof Heart
  label: string
  value: number | string
}

function SmallMetric({ icon: Icon, label, value }: SmallMetricProps) {
  return (
    <div className="min-w-0 border-r border-[#d8edf8] px-2 text-center last:border-r-0">
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
