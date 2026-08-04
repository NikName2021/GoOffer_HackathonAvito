import { ChevronDown, ShoppingBag, Tag } from 'lucide-react'

import type { ReactNode } from 'react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { GetProfileResponse } from '@/types/profileResponse.type'
import { formatDate } from '@/utils/formatterDate'
import { formatCurrency } from '@/utils/formatterNumber'

interface ActivityHistoryProps {
  profile: GetProfileResponse
}

export function ActivityHistory({ profile }: ActivityHistoryProps) {
  return (
    <div className="space-y-6">
      <ActivitySection icon={ShoppingBag} title="Все покупки" count={profile.purchases.length}>
        {profile.purchases.map((purchase) => (
          <ActivityRow
            key={`${purchase.title}-${purchase.purchasedAt}`}
            meta={`${purchase.category} · ${formatDate(purchase.purchasedAt)}`}
            title={purchase.title}
            value={formatCurrency(purchase.price)}
          />
        ))}
      </ActivitySection>

      <ActivitySection icon={Tag} title="Все продажи" count={profile.sales.length}>
        {profile.sales.map((sale) => (
          <ActivityRow
            key={`${sale.title}-${sale.soldAt}`}
            meta={`${sale.category} · ${formatDate(sale.soldAt)} · ${sale.viewCount} просмотров`}
            title={sale.title}
            value={formatCurrency(sale.price)}
          />
        ))}
      </ActivitySection>
    </div>
  )
}

interface ActivitySectionProps {
  children: ReactNode
  count: number
  icon: typeof ShoppingBag
  title: string
}

function ActivitySection({ children, count, icon: Icon, title }: ActivitySectionProps) {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-lg py-1 text-left focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#00aaff]">
        <Icon aria-hidden="true" className="size-4 text-[#00aaff]" />
        <span className="text-base font-bold text-[#1f1f1f]">{title}</span>
        <span className="ml-auto text-xs text-[#8a8d91]">{count}</span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 text-[#8a8d91] transition-transform duration-200 group-data-open:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 overflow-hidden data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0">
        <div className="divide-y divide-[#eceeef] rounded-2xl border border-[#eceeef] bg-white px-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

interface ActivityRowProps {
  meta: string
  title: string
  value: string
}

function ActivityRow({ meta, title, value }: ActivityRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#1f1f1f]">{title}</p>
        <p className="mt-0.5 truncate text-xs text-[#8a8d91]" title={meta}>
          {meta}
        </p>
      </div>
      <p className="shrink-0 text-right text-xs font-bold text-[#1f1f1f]">{value}</p>
    </div>
  )
}
