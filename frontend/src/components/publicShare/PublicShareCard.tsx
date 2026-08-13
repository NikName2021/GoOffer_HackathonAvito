import { RecapIcon } from '@/components/recap/RecapIcon'
import { PublicShareAchievements } from './PublicShareAchievements'
import { cn } from '@/lib/utils'
import type { PublicRecapAchievement, PublicRecapCard } from '@/types/recap.type'

const themes: Record<string, { accent: string; background: string; glow: string }> = {
  'avito-blue': { accent: 'text-[#00aaff]', background: 'from-[#dff5ff] to-[#f5fbff]', glow: 'bg-[#00aaff]/20' },
  'avito-green': { accent: 'text-[#00b956]', background: 'from-[#e3f9ec] to-[#f7fff9]', glow: 'bg-[#00d665]/20' },
  'avito-orange': { accent: 'text-[#ff9f1a]', background: 'from-[#fff0d4] to-[#fffaf1]', glow: 'bg-[#ff9f1a]/20' },
  'avito-purple': { accent: 'text-[#965eeb]', background: 'from-[#eee4ff] to-[#faf7ff]', glow: 'bg-[#965eeb]/20' },
  'avito-red': { accent: 'text-[#ff4053]', background: 'from-[#ffe5e9] to-[#fff7f8]', glow: 'bg-[#ff4053]/20' },
}

interface PublicShareCardProps {
  achievements: PublicRecapAchievement[]
  card: PublicRecapCard
  story?: boolean
}

export function PublicShareCard({ achievements, card, story = false }: PublicShareCardProps) {
  const theme = themes[card.presentation.theme] ?? themes['avito-blue']

  return (
    <article className={cn(
      'relative isolate flex overflow-hidden rounded-[32px] bg-gradient-to-br p-6 shadow-[0_22px_70px_rgba(31,31,31,0.1)] sm:p-8',
      theme.background,
      story ? 'min-h-[58vh] flex-col justify-between' : 'min-h-72 flex-col',
    )}>
      <span aria-hidden="true" className={cn('absolute -top-20 -right-16 -z-10 size-56 rounded-full blur-2xl', theme.glow)} />
      <span className={cn('grid size-14 place-items-center rounded-2xl bg-white/90 shadow-lg', theme.accent)}>
        <RecapIcon name={card.presentation.icon} />
      </span>
      <div className={cn(story ? 'mt-auto' : 'mt-12')}>
        {card.eyebrow && <p className={cn('text-xs font-black tracking-[0.16em] uppercase', theme.accent)}>{card.eyebrow}</p>}
        <h2 className={cn('mt-3 font-black tracking-[-0.045em] text-[#1f1f1f]', story ? 'text-4xl leading-[0.98]' : 'text-3xl leading-tight sm:text-4xl')}>{card.title}</h2>
        {card.value && <p className={cn('mt-4 text-3xl font-black sm:text-4xl', theme.accent)}>{card.value}</p>}
        {card.description && <p className="mt-5 max-w-2xl text-sm leading-6 text-[#515459] sm:text-base">{card.description}</p>}
        {card.kind === 'final' && <PublicShareAchievements achievements={achievements} />}
      </div>
    </article>
  )
}
