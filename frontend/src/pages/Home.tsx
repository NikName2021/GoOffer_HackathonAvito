import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Sparkles, GitCompare, RefreshCw } from 'lucide-react'

import { useProfiles, profileMeta } from '@/hooks/useProfiles'
import { useGenerateRecap } from '@/hooks/useRecap'
import { generateAllRecaps } from '@/api/recap'
import { RECAP_YEAR } from '@/constants/backendProfiles'
import { recapPath, comparePath } from '@/config/paths'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { PersonaBadge } from '@/components/recap/PersonaBadge'

export function HomePage() {
  const navigate = useNavigate()
  const { data: profiles, isLoading, isError } = useProfiles()
  const generate = useGenerateRecap()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [regenAllLoading, setRegenAllLoading] = useState(false)
  const [regenAllMsg, setRegenAllMsg] = useState<string | null>(null)

  async function handleGenerate(userId: string) {
    setError(null)
    setLoadingId(userId)
    try {
      await generate.mutateAsync({ userId, year: RECAP_YEAR })
      navigate(recapPath(userId, RECAP_YEAR))
    } catch (e) {
      console.error(e)
      setError('Не удалось собрать итоги. Запустите backend: docker compose up — порт 8000.')
    } finally {
      setLoadingId(null)
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 2) return [prev[1], id]
      return [...prev, id]
    })
  }

  function handleCompare() {
    if (selected.length !== 2) return
    navigate(comparePath(selected[0], selected[1]))
  }

  async function handleRegenAll() {
    setRegenAllMsg(null)
    setRegenAllLoading(true)
    try {
      const res = await generateAllRecaps(RECAP_YEAR)
      setRegenAllMsg(`Готово: ${res.success} из ${res.total} профилей обновлены`)
    } catch (e) {
      console.error(e)
      setRegenAllMsg('Не удалось пересчитать все итоги. Проверьте backend.')
    } finally {
      setRegenAllLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh bg-white text-[#1f1f1f]">
      <Sidebar />

      <main className="min-w-0 flex-1 px-5 py-10 sm:px-8 lg:px-12 lg:py-14 xl:px-16">
        <div className="mx-auto max-w-[1120px]">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#00aaff]">Авито · Итоги года</p>
              <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
                Чьи итоги посмотрим?
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#6f7377] sm:text-base">
                Выберите тестовый профиль — соберём историю {RECAP_YEAR} года: цифры, ачивки и
                следующий шаг. Отметьте двоих, чтобы сравнить правила генерации.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRegenAll}
                disabled={regenAllLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm font-semibold text-[#1f1f1f] shadow-sm hover:bg-[#f7f8fa] disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${regenAllLoading ? 'animate-spin' : ''}`} />
                {regenAllLoading ? 'Пересчитываем…' : 'Перегенерировать все'}
              </button>

              <button
                type="button"
                disabled={selected.length !== 2}
                onClick={handleCompare}
                className="inline-flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm font-semibold text-[#1f1f1f] shadow-sm hover:bg-[#f7f8fa] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <GitCompare className="h-4 w-4" />
                {selected.length === 2
                  ? 'Сравнить выбранных'
                  : `Сравнить (${selected.length}/2)`}
              </button>
            </div>
          </header>

          {selected.length > 0 && selected.length < 2 && (
            <p className="mt-3 text-sm text-[#6f7377]">
              Выберите ещё одного профиля для сравнения side-by-side.
            </p>
          )}

          {regenAllMsg && (
            <p className="mt-3 text-sm font-medium text-[#00aaff]">{regenAllMsg}</p>
          )}

          {isError && (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              API профилей временно недоступен — показываем встроенные тестовые профили.
            </p>
          )}
          {error && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}

          <section className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {isLoading && !profiles?.length
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-56 animate-pulse rounded-3xl bg-[#f3f4f6]" />
                ))
              : profiles?.map((profile) => {
                  const meta = profileMeta(profile.id)
                  const busy = loadingId === profile.id
                  const isSelected = selected.includes(profile.id)
                  const type = profile.profile_type || meta?.profile_type

                  return (
                    <article
                      key={profile.id}
                      className={`relative flex flex-col rounded-3xl border bg-white p-5 shadow-sm transition-all ${
                        isSelected
                          ? 'border-[#00aaff] ring-2 ring-[#00aaff]/20'
                          : 'border-[#e5e7eb]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSelect(profile.id)}
                        className={`absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-md border text-xs font-bold transition ${
                          isSelected
                            ? 'border-[#00aaff] bg-[#00aaff] text-white'
                            : 'border-[#d1d5db] bg-white text-transparent hover:border-[#00aaff]'
                        }`}
                        aria-label="Выбрать для сравнения"
                      >
                        ✓
                      </button>

                      <div className="flex items-center gap-3 pr-8">
                        <img
                          src={profile.avatar || meta?.avatar || 'https://i.pravatar.cc/150'}
                          alt=""
                          className="h-14 w-14 rounded-full object-cover"
                        />
                        <div>
                          <h2 className="font-bold">{profile.name}</h2>
                          <div className="mt-1">
                            <PersonaBadge profileType={type} size="compact" />
                          </div>
                        </div>
                      </div>
                      <p className="mt-4 flex-1 text-sm text-[#6f7377]">
                        {meta?.tagline ?? 'Тестовый профиль для демо итогов года'}
                      </p>
                      <button
                        type="button"
                        disabled={busy || generate.isPending}
                        onClick={() => handleGenerate(profile.id)}
                        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#00aaff] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0090dd] disabled:opacity-60"
                      >
                        <Sparkles className="h-4 w-4" />
                        {busy ? 'Собираем итоги…' : `Итоги ${RECAP_YEAR}`}
                      </button>
                    </article>
                  )
                })}
          </section>

          {!isLoading && profiles && profiles.length === 0 && (
            <p className="mt-10 text-center text-sm text-[#6f7377]">
              Профилей нет. Проверьте seed-миграции backend.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
