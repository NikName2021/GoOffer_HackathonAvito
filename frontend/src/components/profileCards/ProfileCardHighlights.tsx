import { ArrowDownRight, ArrowUpRight, Heart, MessageCircle, Sparkles } from 'lucide-react'

import type { ProfileHighlightsResponse, ProfileStatsResponse } from '@/types/profileResponse.type'
import { formatCurrency } from '@/utils/formatterNumber'

interface ProfileCardHighlightsProps {
  highlights: ProfileHighlightsResponse
  stats: ProfileStatsResponse
}

export function ProfileCardHighlights({ highlights, stats }: ProfileCardHighlightsProps) {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6f7377]">
          <Sparkles aria-hidden="true" className="size-3.5 text-[#00aaff]" />
          Итоги 2026 года
        </p>
        <span className="text-[11px] font-medium text-[#8a8d91]">{stats.purchasesCount + stats.salesCount} сделок</span>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <MoneyStat
          color="bg-[#e8f6ff]"
          icon={ArrowDownRight}
          iconColor="text-[#00aaff]"
          label="Потрачено"
          value={formatCurrency(stats.totalSpent)}
        />
        <MoneyStat
          color="bg-[#f1eafd]"
          icon={ArrowUpRight}
          iconColor="text-[#965eeb]"
          label="Заработано"
          value={formatCurrency(stats.totalEarned)}
        />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <ActivityHighlight
          label="Дорогая покупка"
          title={highlights.mostExpensivePurchase?.title ?? 'Пока нет'}
          value={highlights.mostExpensivePurchase ? formatCurrency(highlights.mostExpensivePurchase.price) : '—'}
        />
        <ActivityHighlight
          label="Дорогая продажа"
          title={highlights.mostExpensiveSale?.title ?? 'Пока нет'}
          value={highlights.mostExpensiveSale ? formatCurrency(highlights.mostExpensiveSale.price) : '—'}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#eceeef] pt-3 text-[11px] text-[#6f7377]">
        <span className="flex min-w-0 items-center gap-1.5">
          <Heart aria-hidden="true" className="size-3.5 shrink-0 text-[#00aaff]" />
          <span className="truncate">{highlights.favoriteCategory ?? 'Любимая категория ещё не определена'}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <MessageCircle aria-hidden="true" className="size-3.5" />
          {stats.chatsCount}
        </span>
      </div>
    </div>
  )
}

interface MoneyStatProps {
  color: string
  icon: typeof ArrowDownRight
  iconColor: string
  label: string
  value: string
}

function MoneyStat({ color, icon: Icon, iconColor, label, value }: MoneyStatProps) {
  return (
    <div className={`min-w-0 rounded-2xl p-3 ${color}`}>
      <p className="flex items-center gap-1 text-[11px] font-medium text-[#6f7377]">
        <Icon aria-hidden="true" className={`size-3.5 shrink-0 ${iconColor}`} />
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-bold text-[#1f1f1f]" title={value}>
        {value}
      </p>
    </div>
  )
}

interface ActivityHighlightProps {
  label: string
  title: string
  value: string
}

function ActivityHighlight({ label, title, value }: ActivityHighlightProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#eceeef] bg-[#fafafa] p-3">
      <p className="text-[10px] font-medium text-[#8a8d91]">{label}</p>
      <p className="mt-1 truncate text-xs font-semibold text-[#1f1f1f]" title={title}>
        {title}
      </p>
      <p className="mt-1 text-xs font-bold text-[#1f1f1f]">{value}</p>
    </div>
  )
}
