import { Check } from 'lucide-react'

import { RecapIcon } from '@/components/recap/RecapIcon'
import { cardIcons } from '@/constants/cardDefinitionOptions'

interface CardIconPickerProps {
  onChange: (icon: string) => void
  value: string
}

export function CardIconPicker({ onChange, value }: CardIconPickerProps) {
  return (
    <fieldset className="sm:col-span-2">
      <legend className="text-xs font-semibold text-[#6f7377]">Иконка</legend>
      <div className="mt-1.5 grid grid-cols-5 gap-2 sm:grid-cols-9" role="radiogroup">
        {cardIcons.map((icon) => {
          const selected = icon.value === value

          return (
            <button
              aria-checked={selected}
              aria-label={`Иконка ${icon.label}`}
              className={`relative grid aspect-square min-h-12 place-items-center rounded-2xl border transition hover:-translate-y-0.5 hover:border-[#00aaff] hover:bg-[#f2faff] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#00aaff]/25 ${
                selected ? 'border-[#00aaff] bg-[#e8f6ff] text-[#00aaff] shadow-[0_5px_16px_rgba(0,170,255,0.16)]' : 'border-[#dfe1e3] bg-white text-[#6f7377]'
              }`}
              key={icon.value}
              onClick={() => onChange(icon.value)}
              role="radio"
              title={icon.label}
              type="button"
            >
              <RecapIcon name={icon.value} />
              {selected && <Check aria-hidden="true" className="absolute right-1 top-1 size-3 text-[#00aaff]" />}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
