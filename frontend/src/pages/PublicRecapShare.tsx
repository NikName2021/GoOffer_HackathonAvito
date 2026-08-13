import { AlertCircle, LoaderCircle, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'

import { PublicShareCard } from '@/components/publicShare/PublicShareCard'
import { usePublicRecapShare } from '@/hooks/useRecap'
import { cn } from '@/lib/utils'

export function PublicRecapSharePage() {
  const { token = '' } = useParams()
  const shareQuery = usePublicRecapShare(token)

  if (shareQuery.isPending) {
    return <ShareStatus icon={<LoaderCircle className="size-9 animate-spin" />} text="Загружаем итоги года…" />
  }

  if (shareQuery.isError || !shareQuery.data) {
    const message = shareQuery.error instanceof Error
      ? shareQuery.error.message
      : 'Ссылка недействительна или срок её действия истёк.'
    return <ShareStatus error icon={<AlertCircle className="size-9" />} text={message} />
  }

  const { cards, format, year } = shareQuery.data
  const isStory = format === 'mobile_story'

  return (
    <main className={cn(
      'min-h-dvh bg-[radial-gradient(circle_at_top_left,#e7f8ff_0,transparent_28%),radial-gradient(circle_at_bottom_right,#eee6ff_0,transparent_32%),#f7f7f8] text-[#1f1f1f]',
      isStory ? 'grid place-items-center px-3 py-5' : 'px-4 py-8 sm:px-6 sm:py-12',
    )}>
      <div className={cn('w-full', isStory ? 'max-w-[430px]' : 'mx-auto max-w-6xl')}>
        <header className={cn('flex items-center gap-3', isStory ? 'mb-4 px-2' : 'mb-8')}>
          <span className="grid size-11 place-items-center rounded-2xl bg-[#00aaff] text-white shadow-[0_10px_30px_rgba(0,170,255,0.3)]"><Sparkles /></span>
          <div>
            <p className="font-black">Итоги {year} года</p>
            <p className="text-xs text-[#8a8d91]">Публичная подборка · без приватных данных</p>
          </div>
        </header>

        <section aria-label={isStory ? 'История 9:16' : 'Публичные карточки итогов'} className={cn(
          isStory
            ? 'aspect-[9/16] snap-y snap-mandatory overflow-y-auto rounded-[36px] bg-[#15141f] p-3 shadow-[0_30px_90px_rgba(17,17,24,0.3)]'
            : 'grid gap-5 md:grid-cols-2',
        )}>
          {cards.map((card, index) => (
            <div className={cn(isStory && 'flex min-h-full snap-start items-center py-2')} key={`${card.kind}-${index}`}>
              <PublicShareCard achievements={shareQuery.data.achievements} card={card} story={isStory} />
            </div>
          ))}
        </section>

        <footer className={cn('text-center text-xs text-[#8a8d91]', isStory ? 'mt-4' : 'mt-8')}>
          Публичная ссылка действует ограниченное время.
        </footer>
      </div>
    </main>
  )
}

function ShareStatus({ error = false, icon, text }: { error?: boolean; icon: ReactNode; text: string }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f7f7f8] px-5">
      <section className="max-w-md rounded-[32px] bg-white p-8 text-center shadow-[0_24px_80px_rgba(31,31,31,0.1)]">
        <span className={cn('mx-auto grid size-16 place-items-center rounded-2xl', error ? 'bg-[#fff0f2] text-[#ff4053]' : 'bg-[#eaf8ff] text-[#00aaff]')}>{icon}</span>
        <h1 className="mt-5 text-2xl font-black text-[#1f1f1f]">{error ? 'Итоги недоступны' : 'Итоги года'}</h1>
        <p className="mt-2 text-sm leading-6 text-[#6f7377]">{text}</p>
      </section>
    </main>
  )
}
