import { CalendarClock, Edit3, Globe2, Trash2, UserRound } from 'lucide-react'

import { RecapIcon } from '@/components/recap/RecapIcon'
import { Button } from '@/components/ui/button'
import {
  cardAnalysisLabels,
  cardConditionLabels,
  cardMetricLabels,
  cardThemes,
} from '@/constants/cardDefinitionOptions'
import type { CardDefinition } from '@/types/cardDefinition.type'

interface CardDefinitionCardProps {
  definition: CardDefinition
  onDelete: (definition: CardDefinition) => void
  onEdit: (definition: CardDefinition) => void
  profileName?: string
}

export function CardDefinitionCard({ definition, onDelete, onEdit, profileName }: CardDefinitionCardProps) {
  const theme = cardThemes.find((item) => item.value === definition.theme) ?? cardThemes[2]
  const condition =
    definition.condition_operator === 'always'
      ? cardConditionLabels.always
      : `${cardConditionLabels[definition.condition_operator]} ${definition.condition_value}`

  return (
    <article className="relative overflow-hidden rounded-[28px] border border-[#e7e9eb] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
      <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: theme.color }} />
      <div className="flex items-start gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-2xl"
          style={{ backgroundColor: `${theme.color}16`, color: theme.color }}
        >
          <RecapIcon name={definition.icon} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-black text-[#1f1f1f]">{definition.name}</h2>
            <span className={`size-2 rounded-full ${definition.is_active ? 'bg-[#00b956]' : 'bg-[#b6b9bd]'}`} />
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-[#6f7377]">{definition.title}</p>
        </div>
        <div className="flex gap-1">
          <Button
            aria-label={`Редактировать ${definition.name}`}
            className="text-[#00b956]"
            onClick={() => onEdit(definition)}
            size="icon-sm"
            variant="ghost"
          >
            <Edit3 />
          </Button>
          <Button
            aria-label={`Удалить ${definition.name}`}
            className="text-[#ff4053]"
            onClick={() => onDelete(definition)}
            size="icon-sm"
            variant="ghost"
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-[#f7f8f9] p-3">
          <dt className="text-[#8a8d91]">Метрика</dt>
          <dd className="mt-1 font-bold text-[#1f1f1f]">{cardMetricLabels[definition.metric]}</dd>
        </div>
        <div className="rounded-xl bg-[#f7f8f9] p-3">
          <dt className="text-[#8a8d91]">Расчёт</dt>
          <dd className="mt-1 font-bold text-[#1f1f1f]">{cardAnalysisLabels[definition.analysis]}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-[#6f7377]">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#f2f3f5] px-2.5 py-1">
          <CalendarClock className="size-3" />
          {condition}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#f2f3f5] px-2.5 py-1">
          {definition.target_user_id ? <UserRound className="size-3" /> : <Globe2 className="size-3" />}
          {profileName ?? 'Все профили'}
        </span>
      </div>
    </article>
  )
}
