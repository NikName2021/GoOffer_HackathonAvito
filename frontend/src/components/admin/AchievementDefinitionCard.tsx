import { Edit3, Hash, SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cardConditionLabels, cardMetricLabels } from '@/constants/cardDefinitionOptions'
import type { AchievementDefinition } from '@/types/achievementDefinition.type'

interface AchievementDefinitionCardProps {
  achievement: AchievementDefinition
  editDisabled?: boolean
  onEdit: (achievement: AchievementDefinition) => void
}

export function AchievementDefinitionCard({ achievement, editDisabled = false, onEdit }: AchievementDefinitionCardProps) {
  const condition =
    achievement.condition_operator === 'always'
      ? cardConditionLabels.always
      : `${cardConditionLabels[achievement.condition_operator]} ${achievement.condition_value}`

  return (
    <article className="relative overflow-hidden rounded-[28px] border border-[#e7e9eb] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
      <span className={`absolute inset-x-0 top-0 h-1 ${achievement.is_active ? 'bg-[#00aaff]' : 'bg-[#b6b9bd]'}`} />
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e8f6ff] text-xl">{achievement.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-black text-[#1f1f1f]">{achievement.title}</h2>
            <span className={`size-2 rounded-full ${achievement.is_active ? 'bg-[#00b956]' : 'bg-[#b6b9bd]'}`} />
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-[#6f7377]">{achievement.description || 'Описание не указано'}</p>
        </div>
        <Button
          aria-label={`Редактировать ачивку ${achievement.title}`}
          className="text-[#00b956]"
          disabled={editDisabled}
          onClick={() => onEdit(achievement)}
          size="icon-sm"
          variant="ghost"
        >
          <Edit3 />
        </Button>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-[#f7f8f9] p-3">
          <dt className="text-[#8a8d91]">Метрика</dt>
          <dd className="mt-1 font-bold text-[#1f1f1f]">{cardMetricLabels[achievement.metric]}</dd>
        </div>
        <div className="rounded-xl bg-[#f7f8f9] p-3">
          <dt className="text-[#8a8d91]">Статус</dt>
          <dd className="mt-1 font-bold text-[#1f1f1f]">{achievement.is_active ? 'Активна' : 'Отключена'}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-[#6f7377]">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#f2f3f5] px-2.5 py-1">
          <SlidersHorizontal className="size-3" />
          {condition}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#f2f3f5] px-2.5 py-1">
          <Hash className="size-3" />
          {achievement.slug}
        </span>
      </div>
    </article>
  )
}
