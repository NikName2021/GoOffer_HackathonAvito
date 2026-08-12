import { useState, type FormEvent } from 'react'

import { CheckboxField, DefinitionSelect, TextAreaField, TextField } from './CardDefinitionControls'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cardConditionLabels, cardMetricLabels } from '@/constants/cardDefinitionOptions'
import type {
  AchievementCondition,
  AchievementDefinition,
  AchievementDefinitionOptions,
  AchievementDefinitionRequest,
  AchievementMetric,
} from '@/types/achievementDefinition.type'

function toRequest(achievement: AchievementDefinition): AchievementDefinitionRequest {
  return {
    condition_operator: achievement.condition_operator,
    condition_value: achievement.condition_operator === 'always' ? null : achievement.condition_value,
    description: achievement.description,
    icon: achievement.icon,
    is_active: achievement.is_active,
    metric: achievement.metric,
    title: achievement.title,
  }
}

interface AchievementDefinitionDialogProps {
  achievement: AchievementDefinition
  error?: string
  onOpenChange: (open: boolean) => void
  onSubmit: (definition: AchievementDefinitionRequest) => Promise<void>
  open: boolean
  options: AchievementDefinitionOptions
  submitting: boolean
}

export function AchievementDefinitionDialog({
  achievement,
  error,
  onOpenChange,
  onSubmit,
  open,
  options,
  submitting,
}: AchievementDefinitionDialogProps) {
  const [definition, setDefinition] = useState(() => toRequest(achievement))

  function changeCondition(condition_operator: AchievementCondition) {
    setDefinition((current) => ({
      ...current,
      condition_operator,
      condition_value: condition_operator === 'always' ? null : (current.condition_value ?? 0),
    }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await onSubmit(definition)
      onOpenChange(false)
    } catch {
      // Ошибка сохранения остаётся в React Query и показывается в диалоге.
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:max-w-2xl sm:p-7">
        <DialogHeader className="pr-10">
          <DialogTitle className="text-2xl font-black text-[#1f1f1f]">Редактировать ачивку</DialogTitle>
          <DialogDescription>Настройте правило получения встроенной ачивки для следующих итогов года.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <section className="grid gap-4 rounded-3xl bg-[#f7fcff] p-4 sm:grid-cols-2">
            <TextField
              label="Название ачивки"
              maxLength={160}
              onChange={(event) => setDefinition({ ...definition, title: event.target.value })}
              required
              value={definition.title}
            />
            <TextField
              label="Иконка"
              maxLength={50}
              onChange={(event) => setDefinition({ ...definition, icon: event.target.value })}
              required
              value={definition.icon}
            />
            <div className="sm:col-span-2">
              <TextAreaField
                label="Описание"
                maxLength={500}
                onChange={(event) => setDefinition({ ...definition, description: event.target.value })}
                value={definition.description}
              />
            </div>
            <DefinitionSelect<AchievementMetric>
              label="Метрика"
              onChange={(metric) => setDefinition({ ...definition, metric })}
              options={options.metrics.map((value) => ({ label: cardMetricLabels[value], value }))}
              value={definition.metric}
            />
            <DefinitionSelect<AchievementCondition>
              label="Условие получения"
              onChange={changeCondition}
              options={options.conditions.map((value) => ({ label: cardConditionLabels[value], value }))}
              value={definition.condition_operator}
            />
            {definition.condition_operator !== 'always' && (
              <TextField
                label="Пороговое значение"
                min={0}
                onChange={(event) =>
                  setDefinition({
                    ...definition,
                    condition_value: event.target.value === '' ? null : event.target.valueAsNumber,
                  })
                }
                required
                type="number"
                value={definition.condition_value ?? ''}
              />
            )}
            <div className="sm:col-span-2">
              <CheckboxField
                checked={definition.is_active}
                label="Ачивка активна"
                onChange={(event) => setDefinition({ ...definition, is_active: event.target.checked })}
              />
            </div>
          </section>
          <p className="rounded-2xl bg-[#fff8e7] px-4 py-3 text-xs leading-5 text-[#8a661f]">
            Изменения применятся при следующей генерации итогов. Уже сохранённые итоги не изменятся.
          </p>
          <DialogFooter className="sticky bottom-0 -mx-1 border-t border-[#eceeef] bg-white px-1 pt-4">
            {error && <p className="mr-auto self-center text-xs text-[#ff4053]">{error}</p>}
            <Button disabled={submitting} onClick={() => onOpenChange(false)} type="button" variant="ghost">
              Отмена
            </Button>
            <Button className="bg-[#00aaff] text-white hover:bg-[#0099e6]" disabled={submitting} type="submit">
              {submitting ? 'Сохраняем…' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
