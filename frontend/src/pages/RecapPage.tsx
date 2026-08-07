import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Share2, RefreshCw, Sparkles } from 'lucide-react'

import { useRecap, useGenerateRecap } from '@/hooks/useRecap'
import { profileMeta } from '@/hooks/useProfiles'
import { StoryHero } from '@/components/recap/StoryHero'
import { MetricCard } from '@/components/recap/MetricCard'
import { AchievementBadge } from '@/components/recap/AchievementBadge'
import { RecommendationCard } from '@/components/recap/RecommendationCard'
import { FadeIn } from '@/components/recap/FadeIn'
import { PersonaBadge } from '@/components/recap/PersonaBadge'
import { EmptyState } from '@/components/recap/EmptyState'
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
      setRefreshError('Не удалось обновить итоги. Проверьте, что backend запущен на порту 8000.')
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
  const { story, achievements, recommendations, top_categories } = enriched
  const hasAchievements = Boolean(achievements?.length)
  const hasRecommendations = Boolean(recommendations?.length)
  const isQuietYear =
    recap.total_views + recap.total_messages + recap.total_purchases + recap.total_sales < 50

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

          <FadeIn delay={0}>
            <StoryHero story={story} year={year} name={meta?.name} />
            {story.highlights && story.highlights.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {story.highlights.map((h) => (
                  <span
                    key={h}
                    className="rounded-full border border-[#d6ebff] bg-[#e8f6ff] px-3 py-1 text-sm font-medium text-[#0077cc]"
                  >
                    {h}
                  </span>
                ))}
              </div>
            )}
          </FadeIn>

          {isQuietYear && (
            <FadeIn delay={80}>
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                <span className="font-semibold">Тихий год.</span> Активности мало — это нормально для
                новичка. Ниже — простые шаги, с чего начать на площадке.
              </div>
            </FadeIn>
          )}

          <FadeIn delay={120}>
            <section className="mt-8">
              <h2 className="text-lg font-bold text-[#1f1f1f]">Ваш год в цифрах</h2>
              <p className="mt-1 text-sm text-[#6f7377]">Что реально делали на площадке</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <MetricCard label="Просмотры" value={recap.total_views} />
                <MetricCard label="Сообщения" value={recap.total_messages} />
                <MetricCard label="Избранное" value={recap.total_favorites} />
                <MetricCard label="Покупки" value={recap.total_purchases} />
                <MetricCard label="Продажи" value={recap.total_sales} />
                <MetricCard label="Дней активности" value={recap.activity_days} />
              </div>
            </section>
          </FadeIn>

          {top_categories && top_categories.length > 0 ? (
            <FadeIn delay={220}>
              <section className="mt-8">
                <h2 className="text-lg font-bold text-[#1f1f1f]">Топ категорий</h2>
                <ul className="mt-4 space-y-2">
                  {top_categories.map((c, i) => (
                    <li
                      key={c.category}
                      className="flex items-center justify-between rounded-xl border border-[#e7e9eb] bg-white px-4 py-3 text-sm"
                    >
                      <span className="font-medium text-[#1f1f1f]">
                        {i + 1}. {c.category}
                      </span>
                      <span className="text-[#6f7377]">{c.count}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </FadeIn>
          ) : null}

          {story.insights && story.insights.length > 0 && (
            <FadeIn delay={320}>
              <section className="mt-8">
                <h2 className="text-lg font-bold text-[#1f1f1f]">Инсайты</h2>
                <ul className="mt-4 space-y-2">
                  {story.insights.map((insight) => (
                    <li
                      key={insight}
                      className="rounded-xl border border-[#e7e9eb] bg-white px-4 py-3 text-sm leading-6 text-[#3c4043]"
                    >
                      {insight}
                    </li>
                  ))}
                </ul>
              </section>
            </FadeIn>
          )}

          <FadeIn delay={420}>
            <section className="mt-8">
              <h2 className="text-lg font-bold text-[#1f1f1f]">Ачивки</h2>
              {hasAchievements ? (
                <div className="mt-4 grid gap-3">
                  {achievements.map((a) => (
                    <AchievementBadge key={a.slug} achievement={a} />
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-[#d1d5db] bg-white px-5 py-6 text-center">
                  <p className="text-sm font-semibold text-[#1f1f1f]">Пока без бейджей</p>
                  <p className="mt-1 text-sm text-[#6f7377]">
                    Ещё чуть активности — и появятся первые ачивки. Смотрите блок «Что сделать
                    дальше».
                  </p>
                </div>
              )}
            </section>
          </FadeIn>

          <FadeIn delay={520}>
            <section className="mt-8">
              <h2 className="text-lg font-bold text-[#1f1f1f]">Что сделать дальше</h2>
              <p className="mt-1 text-sm text-[#6f7377]">
                Короткий next step — чтобы вернуться в продукт
              </p>
              {hasRecommendations ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {recommendations.map((r) => (
                    <RecommendationCard key={r.code} recommendation={r} />
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-[#d6ebff] bg-[#f7fcff] px-5 py-6 text-center">
                  <Sparkles className="mx-auto h-6 w-6 text-[#00aaff]" />
                  <p className="mt-2 text-sm font-semibold text-[#1f1f1f]">
                    Откройте интересную категорию
                  </p>
                  <p className="mt-1 text-sm text-[#6f7377]">
                    Даже без персональных CTA можно начать с поиска — это уже следующий шаг.
                  </p>
                </div>
              )}
            </section>
          </FadeIn>
        </div>
      </main>
    </div>
  )
}
