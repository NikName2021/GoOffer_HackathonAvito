import { ChevronDown, Eye, Heart, MapPin, MessageCircle, PackageCheck, ShoppingBag, Star, Tag, Truck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { GetProfileResponse } from '@/types/profileResponse.type'
import { formatDate } from '@/utils/formatterDate'
import { formatCount, formatCurrency } from '@/utils/formatterNumber'

interface ActivityHistoryProps { profile: GetProfileResponse }
interface BadgeData { icon: LucideIcon; label: string }

export function ActivityHistory({ profile }: ActivityHistoryProps) {
  return (
    <div className="space-y-6">
      <ActivitySection icon={ShoppingBag} title="Все покупки" count={profile.purchases.length}>
        {profile.purchases.map((purchase) => {
          const source = profile.views.find((view) => view.adId === purchase.adId)
          const buy = source?.viewedAt.find((event) => event.type === 'buy')
          const badges: BadgeData[] = [
            { icon: Eye, label: formatCount(source?.viewedAt.filter((event) => event.type === 'watch').length ?? 0, ['просмотр', 'просмотра', 'просмотров']) },
            ...(source?.isFavorite ? [{ icon: Heart, label: 'Было в избранном' }] : []),
            ...(buy?.type === 'buy' && buy.useAvitoDelivery ? [{ icon: Truck, label: 'Авито Доставка' }] : []),
          ]
          return <ActivityRow badges={badges} key={purchase.adId} meta={`${purchase.category} · ${formatDate(purchase.purchasedAt)}`} title={purchase.title} value={formatCurrency(purchase.price)} />
        })}
      </ActivitySection>

      <ActivitySection icon={Tag} title="Все продажи" count={profile.sales.length}>
        {profile.sales.map((sale) => {
          const source = profile.ownAds.find((ad) => ad.adId === sale.adId)
          const badges: BadgeData[] = [
            { icon: Eye, label: formatCount(sale.viewCount, ['просмотр', 'просмотра', 'просмотров']) },
            { icon: Heart, label: `${source?.favoritesCount ?? 0} в избранном` },
            { icon: MessageCircle, label: formatCount(source?.contactsCount ?? 0, ['контакт', 'контакта', 'контактов']) },
            ...(source?.city ? [{ icon: MapPin, label: source.city }] : []),
            ...(sale.review ? [{ icon: Star, label: `${sale.review.rating}/5` }] : []),
          ]
          return <ActivityRow badges={badges} key={sale.adId} meta={`${sale.category} · продано ${formatDate(sale.soldAt)}`} title={sale.title} value={formatCurrency(sale.price)} />
        })}
      </ActivitySection>
    </div>
  )
}

function ActivitySection({ children, count, icon: Icon, title }: { children: ReactNode; count: number; icon: LucideIcon; title: string }) {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-lg py-1 text-left focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#00aaff]">
        <Icon className="size-4 text-[#00aaff]" />
        <span className="text-base font-bold text-[#1f1f1f]">{title}</span>
        <span className="ml-auto rounded-full bg-[#f2f3f5] px-2 py-0.5 text-xs text-[#8a8d91]">{count}</span>
        <ChevronDown className="size-4 text-[#8a8d91] transition-transform group-data-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 overflow-hidden data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0">
        {count ? <div className="space-y-2">{children}</div> : <EmptyActivity />}
      </CollapsibleContent>
    </Collapsible>
  )
}

function ActivityRow({ badges, meta, title, value }: { badges: BadgeData[]; meta: string; title: string; value: string }) {
  return (
    <article className="rounded-2xl border border-[#eceeef] bg-white p-4 transition hover:border-[#ccecff] hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0"><p className="truncate text-sm font-bold text-[#1f1f1f]">{title}</p><p className="mt-1 text-xs text-[#8a8d91]">{meta}</p></div>
        <p className="shrink-0 text-sm font-black text-[#1f1f1f]">{value}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {badges.map(({ icon: Icon, label }) => (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f2f9fd] px-2.5 py-1 text-[11px] font-medium text-[#515459]" key={label}>
            <Icon className="size-3 text-[#00aaff]" />{label}
          </span>
        ))}
      </div>
    </article>
  )
}

function EmptyActivity() {
  return <div className="rounded-2xl border border-dashed border-[#dfe1e3] py-6 text-center text-xs text-[#8a8d91]"><PackageCheck className="mx-auto mb-2 size-5 text-[#00aaff]" />Пока нет данных за этот период</div>
}
