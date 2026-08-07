import { ArrowUpRight } from 'lucide-react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import type { PointerEvent } from 'react'
import { Link } from 'react-router-dom'

import { RecapAchievements } from './RecapAchievements'
import { RecapIcon } from './RecapIcon'
import { RecapOverviewMetrics } from './RecapOverviewMetrics'
import { RecapReason } from './RecapReason'
import { RecapSceneBackground } from './RecapSceneBackground'
import { RecapYearComparison } from './RecapYearComparison'
import { getRecapTheme } from './recapTheme'
import { DialogClose } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { RecapCardResponse, RecapResponse } from '@/types/recap.type'
import { getRecapCtaUrl } from '@/utils/recapCta'
import { getRecapDescription, getRecapReason, isAllTimeRecapCard } from '@/utils/recapCopy'

interface RecapSlideProps {
  card: RecapCardResponse
  recap: RecapResponse
}

export function RecapSlide({ card, recap }: RecapSlideProps) {
  const theme = getRecapTheme(card.presentation.theme)
  const reduceMotion = useReducedMotion()
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const smoothX = useSpring(pointerX, { damping: 22, stiffness: 140 })
  const smoothY = useSpring(pointerY, { damping: 22, stiffness: 140 })
  const rotateX = useTransform(smoothY, [-1, 1], reduceMotion ? [0, 0] : [1.2, -1.2])
  const rotateY = useTransform(smoothX, [-1, 1], reduceMotion ? [0, 0] : [-1.2, 1.2])
  const isOverview = card.kind === 'overview'
  const isFinal = card.kind === 'final'
  const description = getRecapDescription(card, recap)

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    pointerX.set((event.clientX - bounds.left) / bounds.width * 2 - 1)
    pointerY.set((event.clientY - bounds.top) / bounds.height * 2 - 1)
  }

  function resetPointer() {
    pointerX.set(0)
    pointerY.set(0)
  }

  return (
    <motion.article
      className={cn('relative flex h-full min-h-0 overflow-x-hidden overflow-y-auto rounded-[32px] border border-white/80 p-5 shadow-[0_24px_70px_rgba(31,31,31,0.12)] sm:p-6', theme.surface)}
      onPointerLeave={resetPointer}
      onPointerMove={handlePointerMove}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
    >
      <RecapSceneBackground glow={theme.glow} pointerX={smoothX} pointerY={smoothY} />

      <motion.div animate="show" className="relative z-10 flex min-h-0 w-full flex-col" initial="hidden" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
        <motion.span animate={reduceMotion ? undefined : { rotate: [0, 5, -4, 0], y: [0, -5, 0] }} className={cn('grid size-12 shrink-0 place-items-center rounded-2xl border border-white/80 bg-white/80 shadow-lg backdrop-blur-xl sm:size-14', theme.accent)} transition={{ duration: 5, repeat: Infinity }}>
          <RecapIcon name={card.presentation.icon} />
        </motion.span>

        <motion.div className={cn('mt-5 grid items-center gap-5 py-4 sm:gap-8', card.image_url && 'sm:grid-cols-[1fr_240px]')} variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, transition: { duration: 0.55 }, y: 0 } }}>
          <div className="min-w-0">
            {card.eyebrow && <p className={cn('text-xs font-bold tracking-[0.14em] uppercase', theme.accent)}>{card.eyebrow}</p>}
            {isAllTimeRecapCard(card) && <span className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#6f7377] shadow-sm">За всё время</span>}
            <h2 className="mt-2 max-w-2xl text-3xl leading-[0.98] font-black tracking-[-0.055em] text-balance sm:text-[52px]">{card.title}</h2>
            {card.value && <p className={cn('mt-4 text-2xl font-black sm:text-4xl', theme.accent)}>{card.value}</p>}
            <p className="mt-4 max-w-2xl text-sm leading-5 text-[#515459] sm:text-base sm:leading-6">{description}</p>
          </div>

          {card.image_url && (
            <motion.img className="order-first h-36 w-full rounded-3xl border border-white/80 object-cover shadow-2xl sm:order-last sm:h-60" src={card.image_url} alt={card.title} whileHover={reduceMotion ? undefined : { rotate: 1.5, scale: 1.045 }} />
          )}
        </motion.div>

        {isOverview && <RecapOverviewMetrics recap={recap} />}
        {isOverview && <RecapYearComparison recap={recap} />}
        {isFinal && <RecapAchievements achievements={recap.achievements} />}

        {card.cta && (
          <DialogClose
            nativeButton={false}
            render={<Link className="group mt-4 inline-flex w-fit items-center gap-2 rounded-2xl bg-gradient-to-r from-[#00aaff] to-[#008ee6] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(0,170,255,0.28)] transition hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(0,170,255,0.36)]" to={getRecapCtaUrl(card.cta, recap.user_id)} />}
          >
            {card.cta.label}
            <ArrowUpRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </DialogClose>
        )}

        <RecapReason reason={getRecapReason(card)} />
      </motion.div>
    </motion.article>
  )
}
