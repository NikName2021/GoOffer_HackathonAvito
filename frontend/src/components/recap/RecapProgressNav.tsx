import { motion } from 'motion/react'

import type { RecapCardResponse } from '@/types/recap.type'

interface RecapProgressNavProps {
  cards: RecapCardResponse[]
  currentIndex: number
  onSelect: (index: number) => void
}

export function RecapProgressNav({ cards, currentIndex, onSelect }: RecapProgressNavProps) {
  const items = [...cards.map((card) => ({ id: card.id, title: card.title })), { id: 'next-year-mission', title: 'Миссия на следующий год' }]

  return (
    <nav aria-label="Навигация по итогам" className="flex gap-1">
      {items.map((item, index) => (
        <button
          aria-label={`Открыть итог ${index + 1}: ${item.title}`}
          className="relative h-1.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-[#e5e7e9]"
          key={item.id}
          onClick={() => onSelect(index)}
          type="button"
        >
          <motion.span
            animate={{ scaleX: index <= currentIndex ? 1 : 0 }}
            className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-[#00aaff] to-[#965eeb]"
            transition={{ duration: 0.35 }}
          />
        </button>
      ))}
    </nav>
  )
}
