import { Check } from 'lucide-react'

import { achievementIcons } from '@/constants/achievementIcons'

interface AchievementIconPickerProps {
  disabled?: boolean
  onChange: (icon: string) => void
  value: string
}

export function AchievementIconPicker({ disabled = false, onChange, value }: AchievementIconPickerProps) {
  const hasLegacyIcon = !achievementIcons.some((icon) => icon.value === value)
  const icons = hasLegacyIcon ? [{ label: 'Текущая', value }, ...achievementIcons] : achievementIcons

  return (
    <fieldset className="sm:col-span-2">
      <legend className="text-xs font-semibold text-[#6f7377]">Иконка ачивки</legend>
      <div className="mt-1.5 grid grid-cols-4 gap-2 sm:grid-cols-6" role="radiogroup">
        {icons.map((icon) => {
          const selected = icon.value === value

          return (
            <button
              aria-checked={selected}
              aria-label={`Иконка ${icon.label}`}
              className={`relative grid aspect-square min-h-14 place-items-center rounded-2xl border transition hover:-translate-y-0.5 hover:border-[#00aaff] hover:bg-[#f2faff] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#00aaff]/25 ${
                selected ? 'border-[#00aaff] bg-[#e8f6ff] shadow-[0_5px_16px_rgba(0,170,255,0.16)]' : 'border-[#dfe1e3] bg-white'
              }`}
              disabled={disabled}
              key={icon.value}
              onClick={() => onChange(icon.value)}
              role="radio"
              title={icon.label}
              type="button"
            >
              <span aria-hidden="true" className="text-2xl leading-none">{icon.value}</span>
              {selected && <Check aria-hidden="true" className="absolute right-1.5 top-1.5 size-3.5 text-[#00aaff]" />}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
