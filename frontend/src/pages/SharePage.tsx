import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Copy, Check, ArrowLeft, Download } from 'lucide-react'
import { toPng } from 'html-to-image'

import { useShareRecap } from '@/hooks/useRecap'
import { StoryHero } from '@/components/recap/StoryHero'
import { AchievementBadge } from '@/components/recap/AchievementBadge'
import { EmptyState } from '@/components/recap/EmptyState'
import { PersonaBadge } from '@/components/recap/PersonaBadge'
import { PATHS } from '@/config/paths'
import { RECAP_YEAR } from '@/constants/backendProfiles'
import { withStory } from '@/utils/buildStory'
import { formatCount } from '@/utils/formatterNumber'

export function SharePage() {
  const { userId = '', year: yearParam } = useParams()
  const year = Number(yearParam) || RECAP_YEAR
  const { data, isLoading, isError } = useShareRecap(userId, year)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  async function copyLink() {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function downloadPng() {
    if (!cardRef.current) return
    setDownloading(true)
    setDownloadError(null)
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      })
      const link = document.createElement('a')
      link.download = `avito-itogi-${year}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('PNG export failed', e)
      setDownloadError('Не удалось сохранить PNG. Попробуйте ещё раз или скопируйте ссылку.')
    } finally {
      setDownloading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#f7f8fa]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#00aaff] border-t-transparent" />
        <p className="text-sm text-[#6f7377]">Готовим публичную карточку…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f7f8fa] px-5">
        <EmptyState
          icon="🔗"
          title="Карточка пока недоступна"
          description="Сначала соберите итоги года — share появится автоматически, без id и user_id."
          secondaryHref={PATHS.HOME}
          secondaryLabel="На главную"
          tone="soft"
        />
      </div>
    )
  }

  const enriched = withStory(data)
  const hasAchievements = Boolean(data.achievements?.length)

  return (
    <div className="min-h-dvh bg-[#f7f8fa] px-5 py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to={PATHS.HOME}
            className="inline-flex items-center gap-1.5 text-sm text-[#6f7377] hover:text-[#1f1f1f]"
          >
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#e7e9eb] bg-white px-3 py-2 text-sm font-medium text-[#1f1f1f] hover:bg-[#f5f5f5]"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  Скопировано
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Скопировать ссылку
                </>
              )}
            </button>

            <button
              type="button"
              onClick={downloadPng}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#00aaff] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0090dd] disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {downloading ? 'Сохраняем…' : 'Скачать PNG'}
            </button>
          </div>
        </div>

        {downloadError && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {downloadError}
          </p>
        )}

        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-[#6f7377]">
          Публичная карточка · без id / user_id
        </p>

        <div
          ref={cardRef}
          className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-sm"
        >
          <div className="p-6">
            <StoryHero story={enriched.story} year={enriched.year} />
            <div className="mt-4">
              <PersonaBadge persona={enriched.story.persona} size="compact" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-px border-t border-[#e7e9eb] bg-[#e7e9eb]">
            <div className="bg-white p-4 text-center">
              <p className="text-xl font-bold text-[#1f1f1f]">{formatCount(data.total_views)}</p>
              <p className="text-xs text-[#6f7377]">просмотров</p>
            </div>
            <div className="bg-white p-4 text-center">
              <p className="text-xl font-bold text-[#1f1f1f]">{formatCount(data.activity_days)}</p>
              <p className="text-xs text-[#6f7377]">дней</p>
            </div>
            <div className="bg-white p-4 text-center">
              <p className="text-xl font-bold text-[#1f1f1f]">{data.achievements?.length ?? 0}</p>
              <p className="text-xs text-[#6f7377]">ачивок</p>
            </div>
          </div>

          {hasAchievements ? (
            <div className="space-y-2 border-t border-[#e7e9eb] p-5">
              {data.achievements.map((a) => (
                <AchievementBadge key={a.slug} achievement={a} />
              ))}
            </div>
          ) : (
            <div className="border-t border-[#e7e9eb] px-5 py-6 text-center text-sm text-[#6f7377]">
              Год без бейджей — но история уже есть. Следующий год будет ярче.
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-[#6f7377]">
          Данные обезличены — можно безопасно делиться
        </p>

        <Link
          to={PATHS.HOME}
          className="mt-4 block text-center text-sm font-semibold text-[#00aaff] hover:underline"
        >
          Собрать свои итоги на Авито
        </Link>
      </div>
    </div>
  )
}
