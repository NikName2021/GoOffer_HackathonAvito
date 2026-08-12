import { Award, RotateCw } from 'lucide-react'
import { useState } from 'react'

import { AchievementDefinitionCard } from './AchievementDefinitionCard'
import { AchievementDefinitionDialog } from './AchievementDefinitionDialog'
import { Button } from '@/components/ui/button'
import {
  useAchievementDefinitionOptions,
  useAchievementDefinitions,
  useUpdateAchievementDefinition,
} from '@/hooks/useAchievementDefinitions'
import type { AchievementDefinition, AchievementDefinitionRequest } from '@/types/achievementDefinition.type'

export function AchievementDefinitionsSection({ enabled }: { enabled: boolean }) {
  const achievementsQuery = useAchievementDefinitions(enabled)
  const optionsQuery = useAchievementDefinitionOptions(enabled)
  const updateMutation = useUpdateAchievementDefinition()
  const [editing, setEditing] = useState<AchievementDefinition | null>(null)
  const achievements = achievementsQuery.data ?? []

  function openEdit(achievement: AchievementDefinition) {
    updateMutation.reset()
    setEditing(achievement)
  }

  async function save(definition: AchievementDefinitionRequest) {
    if (editing) await updateMutation.mutateAsync({ definition, slug: editing.slug })
  }

  return (
    <section className="mt-10" aria-labelledby="achievements-heading">
      <div>
        <p className="flex items-center gap-2 text-sm font-bold text-[#965eeb]">
          <Award className="size-4" />
          Встроенные правила
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-[-0.02em]" id="achievements-heading">
          Встроенные ачивки
        </h2>
        <p className="mt-1 text-sm text-[#6f7377]">Редактируйте условия существующих достижений без создания новых.</p>
      </div>

      {achievementsQuery.isPending && <AchievementNotice text="Загружаем встроенные ачивки…" />}
      {achievementsQuery.isError && (
        <AchievementNotice action={() => void achievementsQuery.refetch()} text={achievementsQuery.error.message} />
      )}
      {optionsQuery.isError && (
        <AchievementNotice action={() => void optionsQuery.refetch()} text={optionsQuery.error.message} />
      )}
      {achievementsQuery.isSuccess && achievements.length === 0 && (
        <AchievementNotice text="Встроенные ачивки пока не настроены." />
      )}
      {achievements.length > 0 && (
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {achievements.map((achievement) => (
            <AchievementDefinitionCard
              achievement={achievement}
              editDisabled={!optionsQuery.data}
              key={achievement.slug}
              onEdit={openEdit}
            />
          ))}
        </div>
      )}

      {editing && optionsQuery.data && (
        <AchievementDefinitionDialog
          achievement={editing}
          error={updateMutation.error?.message}
          key={editing.slug}
          onOpenChange={(open) => !open && setEditing(null)}
          onSubmit={save}
          open
          options={optionsQuery.data}
          submitting={updateMutation.isPending}
        />
      )}
    </section>
  )
}

function AchievementNotice({ action, text }: { action?: () => void; text: string }) {
  return (
    <div className="mt-5 rounded-3xl border border-[#e7e9eb] bg-[#f7fcff] p-7 text-center text-sm text-[#6f7377]">
      <p>{text}</p>
      {action && (
        <Button className="mt-3 text-[#00aaff]" onClick={action} variant="ghost">
          <RotateCw />
          Повторить
        </Button>
      )}
    </div>
  )
}
