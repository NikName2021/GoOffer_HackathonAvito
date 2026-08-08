import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Share2, RefreshCw } from 'lucide-react'

import { useRecap, useGenerateRecap } from '@/hooks/useRecap'
import { profileMeta } from '@/hooks/useProfiles'
import { PersonaBadge } from '@/components/recap/PersonaBadge'
import { EmptyState } from '@/components/recap/EmptyState'
import { RecapStories } from '@/components/recap/RecapStories'
import { sharePath, PATHS } from '@/config/paths'
import { RECAP_YEAR } from '@/constants/backendProfiles'
import { withStory } from '@/utils/buildStory'
import { Sidebar } from '@/components/sidebar/Sidebar'

export function RecapPage() {
  const { userId = '', year: yearParam } = useParams()
  const year = Number(yearParam) || RECAP_YEAR
  const meta = profileMeta(userId)
  const { data: recap, isLoading, isError, refetch } = useRecap(userId, year)
  const generate = useGenerateRecap()
  const [refreshError, setRefreshError] = useState<string | null>(null)

  async function regenerate() {
    setRefreshError(null)
    try {
      await generate.mutateAsync({ userId, year })
      await refetch()
    } catch (e) {
      console.error(e)
      setRefreshError(
        'Не удалось обновить итоги. Проверьте, что backend запущен на порту 8000.',
      )
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-dvh bg-white">
        <Sidebar />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#00aaff] border-t-transparent" />
          <p className="text-sm font-medium text-[#6f7377]">Собираем итоги года…</p>
          <p className="text-xs text-[#9aa0a6]">Метрики, ачивки и персональная история</p>
        </div>
      </div>
    )
  }

  if (isError || !recap) {
    return (
      <div className="flex min-h-dvh bg-white">
        <Sidebar />
        <div className="flex flex-1 items-center justify-center px-5">
          <EmptyState
            icon="📊"
            title="Итоги ещё не собраны"
            description={
              meta
                ? `Для «${meta.name}» recap пока нет. Нажмите кнопку — соберём историю ${year} года.`
                : `Сгенерируйте персональный recap за ${year} год.`
            }
            actionLabel={generate.isPending ? 'Генерируем…' : 'Собрать итоги'}
            onAction={() => regenerate()}
            actionDisabled={generate.isPending}
            secondaryHref={PATHS.HOME}
            secondaryLabel="← К профилям"
            tone="soft"
          />
        </div>
      </div>
    )
  }

  const enriched = withStory(recap, meta?.name)
  const { story } = enriched
  const isQuietYear =
    recap.total_views +
      recap.total_messages +
      recap.total_purchases +
      recap.total_sales <
    50

  return (
    <div className="flex min-h-dvh bg-[#f7f8fa]">
      <Sidebar />

      <main className="min-w-0 flex-1 pb-16">
        <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link
              to={PATHS.HOME}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#6f7377] hover:text-[#1f1f1f]"
            >
              <ArrowLeft className="h-4 w-4" />К профилям
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <PersonaBadge
                persona={story.persona}
                profileType={meta?.profile_type}
                size="compact"
              />
              <button
                type="button"
                onClick={() => regenerate()}
                disabled={generate.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#e7e9eb] bg-white px-3 py-2 text-sm font-medium text-[#1f1f1f] disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${generate.isPending ? 'animate-spin' : ''}`} />
                {generate.isPending ? 'Обновляем…' : 'Обновить'}
              </button>
              <Link
                to={sharePath(userId, year)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#00aaff] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0090dd]"
              >
                <Share2 className="h-4 w-4" />
                Поделиться
              </Link>
            </div>
          </div>

          {refreshError && (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {refreshError}
            </p>
          )}

          <RecapStories
            recap={enriched}
            story={story}
            year={year}
            name={meta?.name}
            shareHref={sharePath(userId, year)}
            isQuietYear={isQuietYear}
          />
        </div>
      </main>
    </div>
  )
}
