import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Share2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { Achievement, Recommendation, Story, Recap } from '@/types/recap.type'
import { StoryHero } from '@/components/recap/StoryHero'
import { MetricCard } from '@/components/recap/MetricCard'
import { AchievementBadge } from '@/components/recap/AchievementBadge'
import { RecommendationCard } from '@/components/recap/RecommendationCard'
import { PersonaBadge } from '@/components/recap/PersonaBadge'
import { CategoryChart } from '@/components/recap/CategoryChart'

type Slide = {
  id: string
  title: string
  body: ReactNode
}

type Props = {
  recap: Recap
  story: Story
  year: number
  name?: string
  shareHref: string
  isQuietYear?: boolean
}

/**
 * Показ recap слайдами — «досмотреть до конца».
 * Данные те же, что в длинной странице; меняется только формат.
 */
export function RecapStories({
  recap,
  story,
  year,
  name,
  shareHref,
  isQuietYear,
}: Props) {
  const achievements = recap.achievements ?? []
  const recommendations = recap.recommendations ?? []
  const top = recap.top_categories ?? []

  const slides: Slide[] = [
    {
      id: 'hero',
      title: 'История',
      body: (
        <div className="space-y-4">
          <StoryHero story={story} year={year} name={name} />
          {story.highlights && story.highlights.length > 0 && (
            <div className="flex flex-wrap gap-2">
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
          {isQuietYear && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <span className="font-semibold">Тихий год.</span> Мало активности — нормально для
              старта. Дальше — цифры и простой следующий шаг.
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'metrics',
      title: 'Цифры',
      body: (
        <div>
          <h2 className="text-xl font-bold text-[#1f1f1f]">Ваш год в цифрах</h2>
          <p className="mt-1 text-sm text-[#6f7377]">Что реально делали на площадке</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetricCard label="Просмотры" value={recap.total_views} />
            <MetricCard label="Сообщения" value={recap.total_messages} />
            <MetricCard label="Избранное" value={recap.total_favorites} />
            <MetricCard label="Покупки" value={recap.total_purchases} />
            <MetricCard label="Продажи" value={recap.total_sales} />
            <MetricCard label="Дней активности" value={recap.activity_days} />
          </div>
        </div>
      ),
    },
  ]

    if (top.length > 0) {
    slides.push({
      id: 'categories',
      title: 'Категории',
      body: (
        <div>
          <h2 className="text-xl font-bold text-[#1f1f1f]">Топ категорий</h2>
          <p className="mt-1 text-sm text-[#6f7377]">Чем интересовались чаще всего</p>
          <CategoryChart categories={top} />
          {story.insights && story.insights.length > 0 && (
            <ul className="mt-5 space-y-2">
              {story.insights.slice(0, 3).map((insight) => (
                <li
                  key={insight}
                  className="rounded-xl border border-[#e7e9eb] bg-white px-4 py-3 text-sm leading-6 text-[#3c4043]"
                >
                  {insight}
                </li>
              ))}
            </ul>
          )}
        </div>
      ),
    })
  }
  slides.push({
    id: 'achievements',
    title: 'Ачивки',
    body: (
      <div>
        <h2 className="text-xl font-bold text-[#1f1f1f]">Ачивки</h2>
        {achievements.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {achievements.map((a: Achievement) => (
              <AchievementBadge key={a.slug} achievement={a} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-[#d1d5db] bg-white px-5 py-8 text-center">
            <p className="text-sm font-semibold text-[#1f1f1f]">Пока без бейджей</p>
            <p className="mt-1 text-sm text-[#6f7377]">
              Ещё чуть активности — и появятся первые ачивки. Смотрите следующий слайд.
            </p>
          </div>
        )}
      </div>
    ),
  })

    slides.push({
    id: 'cta',
    title: 'Дальше',
    body: (
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <PersonaBadge persona={story.persona} size="compact" />
          <span className="text-sm text-[#6f7377]">{year}</span>
        </div>

        <h2 className="text-xl font-bold text-[#1f1f1f]">Что сделать на Авито дальше</h2>
        <p className="mt-1 text-sm leading-6 text-[#6f7377]">
          Итоги — не конец. Выберите шаг, который возвращает в продукт.
        </p>
        <p className="mt-2 text-xs leading-5 text-[#9aa0a6]">
          Без переписок, чужих профилей и точных покупок — только ваш безопасный next step.
        </p>

        {recommendations.length > 0 ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {recommendations.map((r: Recommendation) => (
              <RecommendationCard key={r.code} recommendation={r} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-[#d6ebff] bg-[#f7fcff] px-5 py-6 text-center text-sm text-[#6f7377]">
            Откройте интересную категорию на Авито — это уже следующий шаг.
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-[#e7e9eb] bg-white p-4">
          <p className="text-sm font-semibold text-[#1f1f1f]">Поделиться итогами</p>
          <p className="mt-1 text-xs leading-5 text-[#6f7377]">
            Публичная карточка без id и user_id — можно отправить друзьям.
          </p>
          <Link
            to={shareHref}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#00aaff] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[#0090dd]"
          >
            <Share2 className="h-4 w-4" />
            Открыть безопасный Share
          </Link>
        </div>
      </div>
    ),
  })

  const [index, setIndex] = useState(0)
  const total = slides.length
  const isFirst = index === 0
  const isLast = index === total - 1

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => Math.min(total - 1, Math.max(0, i + delta)))
    },
    [total],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        go(1)
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        go(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  const slide = slides[index]

  return (
    <div className="flex flex-col">
      {/* progress */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex flex-1 gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={s.title}
              onClick={() => setIndex(i)}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= index ? 'bg-[#00aaff]' : 'bg-[#e5e7eb]'
              }`}
            />
          ))}
        </div>
        <span className="shrink-0 text-xs font-semibold text-[#6f7377]">
          {index + 1}/{total}
        </span>
      </div>

      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#00aaff]">
        {slide.title}
      </p>

      <div
        key={slide.id}
        className="min-h-[320px] animate-[fadeIn_0.35s_ease-out]"
      >
        {slide.body}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={isFirst}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#e7e9eb] bg-white px-4 py-2.5 text-sm font-semibold text-[#1f1f1f] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Назад
        </button>

        {!isLast ? (
          <button
            type="button"
            onClick={() => go(1)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#00aaff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0090dd]"
          >
            Далее
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <Link
            to={shareHref}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#00aaff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0090dd]"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Link>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-[#9aa0a6]">
        ← → на клавиатуре · досмотрите до конца — там следующий шаг
      </p>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
