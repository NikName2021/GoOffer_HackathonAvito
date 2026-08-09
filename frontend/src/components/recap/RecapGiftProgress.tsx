import { Sparkles } from 'lucide-react'
import { motion } from 'motion/react'

const hitMessages = [
  'Нажмите на посылку',
  'Первая трещина! Нажмите ещё',
  'Коробка уже поддаётся',
  'Ещё один удар!',
  'Открываем ваши итоги…',
]

interface RecapGiftProgressProps {
  hits: number
  opening: boolean
  requiredHits: number
}

export function RecapGiftProgress({ hits, opening, requiredHits }: RecapGiftProgressProps) {
  return (
    <div aria-live="polite" className="m-5 flex flex-col items-center gap-2">
      <motion.span
        animate={{ opacity: opening ? 0 : [0.78, 1, 0.78] }}
        className="inline-flex items-center gap-2 text-sm font-bold text-white/90"
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Sparkles className="size-4 text-[#ffcf40]" />
        {hitMessages[hits]}
      </motion.span>
      <div className="flex gap-1.5" role="presentation">
        {Array.from({ length: requiredHits }, (_, index) => (
          <motion.i
            animate={{
              backgroundColor: index < hits ? '#00aaff' : 'rgba(255,255,255,.2)',
              scale: index < hits ? 1.18 : 1,
            }}
            className="size-1.5 rounded-full"
            key={index}
          />
        ))}
      </div>
    </div>
  )
}
