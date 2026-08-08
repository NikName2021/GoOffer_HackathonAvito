import { Check } from 'lucide-react'
import { useState } from 'react'

import { MissionIcon } from './MissionIcon'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MissionCode, MissionOption } from '@/types/mission.type'

interface MissionOptionsProps {
  currentCode?: MissionCode
  isPending: boolean
  options: MissionOption[]
  onSelect: (code: MissionCode) => void
}

const themeClasses: Record<string, string> = {
  'avito-blue': 'from-[#dff4ff] to-[#f3fbff] text-[#00aaff]',
  'avito-green': 'from-[#dcfaea] to-[#f2fff7] text-[#00b956]',
  'avito-red': 'from-[#ffe7eb] to-[#fff5f6] text-[#ff4053]',
}

export function MissionOptions({ currentCode, isPending, onSelect, options }: MissionOptionsProps) {
  const [selectedCode, setSelectedCode] = useState<MissionCode | undefined>()

  return (
    <div className="mt-4">
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const isSelected = selectedCode === option.code
          return (
            <button
              aria-pressed={isSelected}
              className={cn(
                'relative min-h-40 rounded-3xl border bg-gradient-to-br p-4 text-left transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#00aaff]/30',
                themeClasses[option.theme] ?? themeClasses['avito-blue'],
                isSelected ? 'border-current shadow-md' : 'border-white/80',
              )}
              key={option.code}
              onClick={() => setSelectedCode(option.code)}
              type="button"
            >
              <span className="grid size-10 place-items-center rounded-2xl bg-white shadow-sm">
                <MissionIcon className="size-5" name={option.icon} />
              </span>
              {isSelected && <Check aria-hidden="true" className="absolute top-4 right-4 size-5" />}
              <strong className="mt-4 block text-sm leading-5 text-[#1f1f1f]">{option.title}</strong>
              <span className="mt-1 block text-xs leading-4 text-[#6f7377]">Цель: {option.target}</span>
            </button>
          )
        })}
      </div>

      <Button
        className="mt-3 h-11 w-full bg-[#00aaff] text-base font-bold text-white hover:bg-[#0099f7]"
        disabled={!selectedCode || selectedCode === currentCode || isPending}
        onClick={() => selectedCode && onSelect(selectedCode)}
      >
        {isPending ? 'Сохраняем…' : currentCode ? 'Сменить миссию' : 'Выбрать миссию'}
      </Button>
    </div>
  )
}
