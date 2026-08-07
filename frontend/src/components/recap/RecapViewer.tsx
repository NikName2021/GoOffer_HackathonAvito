import { useEffect, useRef, useState, type TouchEvent } from 'react'

import { RecapControls } from './RecapControls'
import { RecapSlide } from './RecapSlide'
import { ProfileImage } from '@/components/profileCards/ProfileImage'
import type { GetProfileResponse } from '@/types/profileResponse.type'
import type { RecapResponse } from '@/types/recap.type'

interface RecapViewerProps {
  profile: GetProfileResponse
  recap: RecapResponse
}

export function RecapViewer({ profile, recap }: RecapViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const touchStart = useRef<number | null>(null)
  const total = recap.cards.length
  const card = recap.cards[currentIndex]

  function previous() {
    setCurrentIndex((index) => Math.max(0, index - 1))
  }

  function next() {
    setCurrentIndex((index) => (index === total - 1 ? 0 : index + 1))
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') setCurrentIndex((index) => Math.max(0, index - 1))
      if (event.key === 'ArrowRight') setCurrentIndex((index) => (index === total - 1 ? 0 : index + 1))
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
    <div className="flex h-full min-h-0 flex-col bg-[#f7f7f8]" onTouchEnd={handleTouchEnd} onTouchStart={handleTouchStart}>
      <header className="shrink-0 bg-white px-4 pt-4 pb-3 pr-14 sm:px-6 sm:pt-5 sm:pr-16">
        <nav aria-label="Навигация по итогам" className="flex gap-1">
          {recap.cards.map((item, index) => (
            <button
              aria-label={`Открыть итог ${index + 1}: ${item.title}`}
              className={`h-1 flex-1 cursor-pointer rounded-full transition ${index <= currentIndex ? 'bg-[#00aaff]' : 'bg-[#e5e7e9]'}`}
              key={item.id}
              onClick={() => setCurrentIndex(index)}
              type="button"
            />
          ))}
        </nav>
        <div className="mt-3 flex items-center gap-3">
          <ProfileImage profile={profile} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#1f1f1f]">{profile.name}</p>
            <p className="text-xs font-medium text-[#8a8d91]">Авито · Итоги {recap.year}</p>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 p-3 sm:p-5">
        <RecapSlide card={card} key={`${card.id}-${currentIndex}`} recap={recap} />
      </main>
      <RecapControls currentIndex={currentIndex} onNext={next} onPrevious={previous} total={total} />
    </div>
  )
}
