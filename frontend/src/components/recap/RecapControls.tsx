import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'

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
    <footer className="flex h-16 shrink-0 items-center justify-between border-t border-[#e5e7e9] bg-white px-4 sm:px-6">
      <button
        aria-label="Предыдущий итог"
        className="grid size-10 cursor-pointer place-items-center rounded-full bg-[#f2f3f5] transition hover:bg-[#e7e8ea] disabled:cursor-not-allowed disabled:opacity-35"
        disabled={isFirst}
        onClick={onPrevious}
        type="button"
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
      </button>

      <span className="text-xs font-semibold text-[#8a8d91]">{currentIndex + 1} / {total}</span>

      <button
        aria-label={isLast ? 'Посмотреть итоги сначала' : 'Следующий итог'}
        className="grid size-10 cursor-pointer place-items-center rounded-full bg-[#00aaff] text-white transition hover:bg-[#0099e6]"
        onClick={onNext}
        type="button"
      >
        {isLast ? <RotateCcw aria-hidden="true" className="size-4" /> : <ArrowRight aria-hidden="true" className="size-5" />}
      </button>
    </footer>
  )
}
