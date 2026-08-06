import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { RecapAchievements } from './RecapAchievements'
import { RecapIcon } from './RecapIcon'
import { RecapOverviewMetrics } from './RecapOverviewMetrics'
import { getRecapTheme } from './recapTheme'
import { PATHS } from '@/config/paths'
import { cn } from '@/lib/utils'
import type { RecapCardResponse, RecapResponse } from '@/types/recap.type'

interface RecapSlideProps {
  card: RecapCardResponse
  recap: RecapResponse
}

export function RecapSlide({ card, recap }: RecapSlideProps) {
  const theme = getRecapTheme(card.presentation.theme)
  const isOverview = card.kind === 'overview'
  const isFinal = card.kind === 'final'

  return (
    <article className={cn('relative flex h-full min-h-0 overflow-x-hidden overflow-y-auto rounded-[28px] p-5 sm:overflow-hidden sm:p-8', theme.surface)}>
      <span aria-hidden="true" className="absolute -top-20 -right-16 size-64 rounded-full bg-white/45" />
      <span aria-hidden="true" className="absolute -bottom-28 -left-20 size-72 rounded-full bg-white/30" />

      <div className="relative z-10 flex min-h-0 w-full flex-col">
        <span className={cn('grid size-12 shrink-0 place-items-center rounded-2xl bg-white shadow-sm sm:size-14', theme.accent)}>
          <RecapIcon name={card.presentation.icon} />
        </span>

        <div className={cn('mt-auto grid items-center gap-5 py-4 sm:gap-8', card.image_url && 'sm:grid-cols-[1fr_240px]')}>
          <div className="min-w-0">
            {card.eyebrow && <p className={cn('text-xs font-bold tracking-[0.14em] uppercase', theme.accent)}>{card.eyebrow}</p>}
            <h2 className="mt-2 max-w-2xl text-3xl leading-[0.98] font-black tracking-[-0.04em] sm:text-5xl">{card.title}</h2>
            {card.value && <p className={cn('mt-4 text-2xl font-black sm:text-4xl', theme.accent)}>{card.value}</p>}
            <p className="mt-4 max-w-2xl text-sm leading-5 text-[#515459] sm:text-base sm:leading-6">{card.description}</p>
          </div>

          {card.image_url && (
            <img className="order-first h-36 w-full rounded-3xl object-cover shadow-lg sm:order-last sm:h-60" src={card.image_url} alt={card.title} />
          )}
        </div>

        {isOverview && <RecapOverviewMetrics recap={recap} />}
        {isFinal && <RecapAchievements achievements={recap.achievements} />}

        {card.cta && (
          <Link className="mt-4 inline-flex w-fit items-center gap-2 rounded-2xl bg-[#00aaff] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0099e6]" to={PATHS.AVITO}>
            {card.cta.label}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        )}
      </div>
    </article>
  )
}
