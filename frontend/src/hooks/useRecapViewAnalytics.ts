import { useEffect, useRef } from 'react'

import { sendRecapEvent } from '@/api/recapEvents'
import type { RecapCardResponse } from '@/types/recap.type'

export function useRecapViewAnalytics(card: RecapCardResponse | undefined, currentIndex: number, total: number) {
  const viewedSlideIds = useRef(new Set<string>())
  const recapCompletedSent = useRef(false)

  useEffect(() => {
    if (!card) return

    if (!viewedSlideIds.current.has(card.id)) {
      viewedSlideIds.current.add(card.id)
      void sendRecapEvent({ event: 'slide_viewed', cta_visible: Boolean(card.cta) })
    }

    if (currentIndex === total - 1 && !recapCompletedSent.current) {
      recapCompletedSent.current = true
      void sendRecapEvent({ event: 'recap_completed' })
    }
  }, [card, currentIndex, total])
}
