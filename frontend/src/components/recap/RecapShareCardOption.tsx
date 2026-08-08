import { Check } from 'lucide-react'

import { RecapIcon } from './RecapIcon'
import { cn } from '@/lib/utils'
import type { RecapCardResponse } from '@/types/recap.type'

const themes: Record<string, { accent: string; surface: string }> = {
  'avito-blue': { accent: 'text-[#00aaff]', surface: 'from-[#e5f6ff] to-[#f7fcff]' },
  'avito-green': { accent: 'text-[#00b956]', surface: 'from-[#e7faef] to-[#f8fffb]' },
  'avito-orange': { accent: 'text-[#ff9f1a]', surface: 'from-[#fff3df] to-[#fffaf2]' },
  'avito-purple': { accent: 'text-[#965eeb]', surface: 'from-[#f1eafd] to-[#fbf9ff]' },
  'avito-red': { accent: 'text-[#ff4053]', surface: 'from-[#ffecef] to-[#fff8f9]' },
}

interface RecapShareCardOptionProps {
  card: RecapCardResponse
  onToggle: () => void
  selected: boolean
}

export function RecapShareCardOption({ card, onToggle, selected }: RecapShareCardOptionProps) {
  const theme = themes[card.presentation.theme] ?? themes['avito-blue']

  return (
    <button
      aria-pressed={selected}
      className={cn(
        'group relative min-h-40 cursor-pointer overflow-hidden rounded-3xl border border-transparent bg-gradient-to-br p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md',
        theme.surface,
        selected ? 'border-[#00aaff] ring-2 ring-[#00aaff]/15' : 'opacity-75 hover:opacity-100',
      )}
      onClick={onToggle}
      type="button"
    >
      <span className={cn('grid size-10 place-items-center rounded-2xl bg-white shadow-sm [&_svg]:!size-5', theme.accent)}>
        <RecapIcon name={card.presentation.icon} />
      </span>
      <span className={cn('absolute top-4 right-4 grid size-7 place-items-center rounded-full border bg-white transition', selected ? 'border-[#00aaff] text-[#00aaff]' : 'border-[#dfe1e3] text-transparent')}>
        <Check aria-hidden="true" className="size-4" />
      </span>
      {card.eyebrow && <span className="mt-4 block text-[10px] font-bold tracking-[0.12em] text-[#8a8d91] uppercase">{card.eyebrow}</span>}
      <strong className="mt-1 block pr-5 text-base leading-5 font-black text-[#1f1f1f]">{card.title}</strong>
      {card.value && <span className={cn('mt-3 block text-xl font-black', theme.accent)}>{card.value}</span>}
    </button>
  )
}
