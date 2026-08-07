import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react'

import { RecapControls } from './RecapControls'
import { RecapSlide } from './RecapSlide'
import { RecapSharePreview } from './RecapSharePreview'
import { ProfileImage } from '@/components/profileCards/ProfileImage'
import type { GetProfileResponse } from '@/types/profileResponse.type'
import type { RecapResponse } from '@/types/recap.type'

interface RecapViewerProps {
  profile: GetProfileResponse
  recap: RecapResponse
}

const slideVariants: Variants = {
  enter: (direction: number) => ({ filter: 'blur(8px)', opacity: 0, scale: 0.96, x: direction > 0 ? 90 : -90 }),
  center: { filter: 'blur(0px)', opacity: 1, scale: 1, x: 0 },
  exit: (direction: number) => ({ filter: 'blur(8px)', opacity: 0, scale: 0.96, x: direction > 0 ? -90 : 90 }),
}

const reducedSlideVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
}

export function RecapViewer({ profile, recap }: RecapViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const reduceMotion = useReducedMotion()
  const touchStart = useRef<number | null>(null)
  const total = recap.cards.length
  const card = recap.cards[currentIndex]

  function previous() {
    setDirection(-1)
    setCurrentIndex((index) => Math.max(0, index - 1))
  }

  function next() {
    setDirection(1)
    setCurrentIndex((index) => (index === total - 1 ? 0 : index + 1))
  }

  function goTo(index: number) {
    setDirection(index >= currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') {
        setDirection(-1)
        setCurrentIndex((index) => Math.max(0, index - 1))
      }
      if (event.key === 'ArrowRight') {
        setDirection(1)
        setCurrentIndex((index) => (index === total - 1 ? 0 : index + 1))
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [total])

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStart.current = event.touches[0]?.clientX ?? null
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStart.current === null) return
    const distance = event.changedTouches[0].clientX - touchStart.current
    if (Math.abs(distance) > 45) {
      if (distance > 0) previous()
      else next()
    }
    touchStart.current = null
  }

  if (!card) return null

  return (
    <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top_left,#f2eaff_0,transparent_32%),linear-gradient(135deg,#f7fbff,#f8f7fb)]" onTouchEnd={handleTouchEnd} onTouchStart={handleTouchStart}>
      <header className="relative z-20 shrink-0 border-b border-white/70 bg-white/80 px-4 pt-3 pb-2 pr-14 shadow-sm backdrop-blur-2xl sm:px-6 sm:pr-16">
        <nav aria-label="Навигация по итогам" className="flex gap-1">
          {recap.cards.map((item, index) => (
            <button
              aria-label={`Открыть итог ${index + 1}: ${item.title}`}
              className="relative h-1.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-[#e5e7e9]"
              key={item.id}
              onClick={() => goTo(index)}
              type="button"
            ><motion.span animate={{ scaleX: index <= currentIndex ? 1 : 0 }} className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-[#00aaff] to-[#965eeb]" transition={{ duration: 0.35 }} /></button>
          ))}
        </nav>
        <div className="mt-2 flex items-center gap-3">
          <ProfileImage profile={profile} size="small" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#1f1f1f]">{profile.name}</p>
            <p className="text-xs font-medium text-[#8a8d91]">Авито · Итоги {recap.year}</p>
          </div>
          <RecapSharePreview recap={recap} />
        </div>
      </header>

      <main className="relative min-h-0 flex-1 overflow-hidden p-3 sm:p-4">
        <AnimatePresence custom={direction} initial={false} mode="popLayout">
          <motion.div
            animate="center"
            className="h-full"
            custom={direction}
            exit="exit"
            initial="enter"
            key={card.id}
            transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
            variants={reduceMotion ? reducedSlideVariants : slideVariants}
          >
            <RecapSlide card={card} recap={recap} />
          </motion.div>
        </AnimatePresence>
      </main>
      <RecapControls currentIndex={currentIndex} onNext={next} onPrevious={previous} total={total} />
    </div>
  )
}
