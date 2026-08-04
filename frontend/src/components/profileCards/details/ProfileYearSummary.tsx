import { ArrowDownRight, ArrowUpRight, Eye, Heart, MessageCircle, ShoppingBag, Star, Tag } from 'lucide-react'

import { DealMetric, SmallMetric, TopActivity } from './profileYearSummary/SummaryMetrics'
import type { GetProfileResponse } from '@/types/profileResponse.type'
import { formatCount, formatCurrency } from '@/utils/formatterNumber'

interface ProfileYearSummaryProps {
  profile: GetProfileResponse
}

export function ProfileYearSummary({ profile }: ProfileYearSummaryProps) {
  const { highlights, stats } = profile

  return (
    <section className="rounded-3xl border border-[#e7e9eb] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold text-[#1f1f1f]">Итоги 2026 года</p>
          <p className="mt-0.5 text-xs text-[#8a8d91]">Активность пользователя за год</p>
        </div>
        <span className="rounded-full bg-[#f2f3f5] px-2.5 py-1 text-xs font-semibold text-[#6f7377]">
          {formatCount(stats.purchasesCount + stats.salesCount, ['сделка', 'сделки', 'сделок'])}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <DealMetric
          amount={formatCurrency(stats.totalSpent)}
          count={stats.purchasesCount}
          icon={ShoppingBag}
          label="Покупки"
          tone="blue"
        />
        <DealMetric
          amount={formatCurrency(stats.totalEarned)}
          count={stats.salesCount}
          icon={Tag}
          label="Продажи"
          tone="purple"
        />
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#f2f9ff] p-3.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[#00aaff] shadow-sm">
          <Heart aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[#6f7377]">Любимая категория</p>
          <p className="mt-0.5 truncate text-sm font-bold text-[#1f1f1f]">
            {highlights.favoriteCategory ?? 'Пока не определена'}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-[#6f7377]">Крупные сделки года</p>
        <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
          <TopActivity
            icon={ArrowDownRight}
            label="Самая дорогая покупка"
            title={highlights.mostExpensivePurchase?.title ?? 'Покупок пока нет'}
            tone="blue"
            value={
              highlights.mostExpensivePurchase ? formatCurrency(highlights.mostExpensivePurchase.price) : '—'
            }
          />
          <TopActivity
            icon={ArrowUpRight}
            label="Самая дорогая продажа"
            title={highlights.mostExpensiveSale?.title ?? 'Продаж пока нет'}
            tone="purple"
            value={highlights.mostExpensiveSale ? formatCurrency(highlights.mostExpensiveSale.price) : '—'}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 border-t border-[#eceeef] pt-3">
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
