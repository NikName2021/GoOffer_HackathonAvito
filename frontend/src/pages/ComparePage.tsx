import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { useRecap } from '@/hooks/useRecap'
import { profileMeta } from '@/hooks/useProfiles'
import { PATHS } from '@/config/paths'
import { RECAP_YEAR } from '@/constants/backendProfiles'
import { withStory } from '@/utils/buildStory'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { formatCount } from '@/utils/formatterNumber'

function SideCard({
  userId,
  year,
}: {
  userId: string
  year: number
}) {
  const meta = profileMeta(userId)
  const { data, isLoading, isError } = useRecap(userId, year)

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#e7e9eb] bg-white p-6 text-center text-sm text-[#6f7377]">
        Загружаем…
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-[#e7e9eb] bg-white p-6 text-center text-sm text-[#6f7377]">
        Нет итогов. Сначала сгенерируйте recap.
      </div>
    )
  }

  const enriched = withStory(data, meta?.name)
  const { story, achievements } = enriched

  return (
    <div className="rounded-2xl border border-[#e7e9eb] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f6ff] text-sm font-bold text-[#00aaff]">
          {(meta?.name ?? '?').slice(0, 1)}
        </div>
        <div>
          <p className="font-semibold text-[#1f1f1f]">{meta?.name ?? 'Профиль'}</p>
          <p className="text-xs uppercase tracking-wide text-[#6f7377]">
            {story.persona}
          </p>
        </div>
      </div>

      <p className="mb-4 text-sm font-medium leading-5 text-[#1f1f1f]">
        {story.headline}
      </p>

      <div className="grid grid-cols-2 gap-2 text-center text-sm">
        <div className="rounded-xl bg-[#f7f8fa] p-3">
          <p className="text-lg font-bold">{formatCount(data.total_views)}</p>
          <p className="text-xs text-[#6f7377]">просмотры</p>
        </div>
        <div className="rounded-xl bg-[#f7f8fa] p-3">
          <p className="text-lg font-bold">{formatCount(data.activity_days)}</p>
          <p className="text-xs text-[#6f7377]">дней</p>
        </div>
        <div className="rounded-xl bg-[#f7f8fa] p-3">
          <p className="text-lg font-bold">{formatCount(data.total_purchases)}</p>
          <p className="text-xs text-[#6f7377]">покупки</p>
        </div>
        <div className="rounded-xl bg-[#f7f8fa] p-3">
          <p className="text-lg font-bold">{formatCount(data.total_sales)}</p>
          <p className="text-xs text-[#6f7377]">продажи</p>
        </div>
      </div>

      {achievements && achievements.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6f7377]">
            Ачивки · {achievements.length}
          </p>
          {achievements.slice(0, 3).map((a) => (
            <div
              key={a.slug}
              className="flex items-center gap-2 rounded-lg bg-[#f7f8fa] px-3 py-2 text-sm"
            >
              <span>{a.icon}</span>
              <span className="font-medium text-[#1f1f1f]">{a.title}</span>
            </div>
          ))}
        </div>
      )}

      <Link
        to={`/recap/${userId}/${year}`}
        className="mt-4 block text-center text-sm font-semibold text-[#00aaff] hover:underline"
      >
        Открыть полные итоги →
      </Link>
    </div>
  )
}

export function ComparePage() {
  const { userId1 = '', userId2 = '' } = useParams()
  const year = RECAP_YEAR
  const meta1 = profileMeta(userId1)
  const meta2 = profileMeta(userId2)

  return (
    <div className="flex min-h-dvh bg-[#f7f8fa]">
      <Sidebar />
      <main className="min-w-0 flex-1 pb-16">
        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
          <Link
            to={PATHS.HOME}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#6f7377] hover:text-[#1f1f1f]"
          >
            <ArrowLeft className="h-4 w-4" />К профилям
          </Link>

          <h1 className="text-2xl font-bold text-[#1f1f1f]">Сравнение итогов</h1>
          <p className="mt-1 text-sm text-[#6f7377]">
            {meta1?.name ?? 'Профиль 1'} vs {meta2?.name ?? 'Профиль 2'} · {year}
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <SideCard userId={userId1} year={year} />
            <SideCard userId={userId2} year={year} />
          </div>
        </div>
      </main>
    </div>
  )
}