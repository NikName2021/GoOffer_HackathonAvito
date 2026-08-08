import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import { motion } from 'motion/react'

interface RecapControlsProps {
  currentIndex: number
  onNext: () => void
  onPrevious: () => void
  total: number
}

export function RecapControls({ currentIndex, onNext, onPrevious, total }: RecapControlsProps) {
  const isFirst = currentIndex === 0
  const isLast = currentIndex === total - 1

  return (
    <footer className="relative z-20 flex h-14 shrink-0 items-center justify-between border-t border-white/80 bg-white/85 px-4 backdrop-blur-2xl sm:px-6">
      <motion.button
        aria-label="Предыдущий итог"
        className="grid size-10 cursor-pointer place-items-center rounded-2xl border border-white bg-[#f2f3f5] shadow-sm transition hover:bg-[#e7e8ea] disabled:cursor-not-allowed disabled:opacity-35"
        disabled={isFirst}
        onClick={onPrevious}
        type="button"
        whileHover={isFirst ? undefined : { scale: 1.06, x: -2 }}
        whileTap={isFirst ? undefined : { scale: 0.94 }}
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
      </motion.button>

      <span className="text-xs font-semibold text-[#8a8d91]">{currentIndex + 1} / {total}</span>

      <motion.button
        aria-label={isLast ? 'Посмотреть итоги сначала' : 'Следующий итог'}
        className="grid size-10 cursor-pointer place-items-center rounded-2xl bg-gradient-to-br from-[#00aaff] to-[#008ee6] text-white shadow-[0_10px_25px_rgba(0,170,255,0.3)]"
        onClick={onNext}
        type="button"
        whileHover={{ scale: 1.07, x: 2 }}
        whileTap={{ scale: 0.93 }}
      >
        {isLast ? <RotateCcw aria-hidden="true" className="size-4" /> : <ArrowRight aria-hidden="true" className="size-5" />}
      </motion.button>
    </footer>
  )
}
