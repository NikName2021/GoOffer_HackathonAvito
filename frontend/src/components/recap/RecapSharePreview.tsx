import { Check, Download, LoaderCircle, Send, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useShareRecap } from '@/hooks/useRecap'
import type { RecapCardResponse, RecapResponse, ShareRecapResponse } from '@/types/recap.type'
import { downloadRecapShareImage } from '@/utils/recapShareImage'

interface RecapSharePreviewProps {
  recap: RecapResponse
}

function buildShareText(data: ShareRecapResponse, cards: RecapCardResponse[]) {
  const highlights = cards.slice(0, 4).map((card) => `• ${card.title}${card.value ? ` — ${card.value}` : ''}`)
  return [`Итоги ${data.year} года на Авито`, data.summary.headline, ...highlights].join('\n')
}

export function RecapSharePreview({ recap }: RecapSharePreviewProps) {
  const shareMutation = useShareRecap()
  const [shared, setShared] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  function handleOpenChange(open: boolean) {
    setShared(false)
    if (open && !shareMutation.data && !shareMutation.isPending) {
      shareMutation.mutate(
        { userId: recap.user_id, year: recap.year },
        { onSuccess: (data) => setSelectedIds(data.cards.map((card) => card.id)) },
      )
    }
  }

  async function share() {
    if (!shareMutation.data) return
    const text = buildShareText(shareMutation.data, selectedCards)
    try {
      if (navigator.share) await navigator.share({ text, title: `Итоги ${recap.year} года` })
      else await navigator.clipboard.writeText(text)
      setShared(true)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
    }
  }

  const error = shareMutation.error instanceof Error ? shareMutation.error.message : undefined
  const selectedCards = shareMutation.data?.cards.filter((card) => selectedIds.includes(card.id)) ?? []

  function toggleCard(cardId: string) {
    setSelectedIds((ids) => ids.includes(cardId) ? ids.filter((id) => id !== cardId) : [...ids, cardId])
  }

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#eaf8ff] px-3 py-2 text-xs font-bold text-[#00aaff] hover:bg-[#dff4ff]">
        <Send aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">Поделиться</span>
      </DialogTrigger>
      <DialogContent className="max-h-[min(720px,calc(100dvh-2rem))] overflow-y-auto sm:max-w-xl">
        <div className="pr-10">
          <DialogTitle className="text-xl font-black">Предпросмотр публикации</DialogTitle>
          <DialogDescription className="mt-2">Здесь только данные, разрешённые безопасным share-ответом backend.</DialogDescription>
        </div>

        {shareMutation.isPending && <div className="grid min-h-52 place-items-center"><LoaderCircle className="size-8 animate-spin text-[#00aaff]" /></div>}
        {error && <div className="rounded-2xl bg-[#fff0f2] p-4 text-sm text-[#ff4053]">{error}</div>}
        {shareMutation.data && (
          <div className="space-y-4">
            <section className="rounded-3xl bg-[#eaf8ff] p-5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#00aaff]"><ShieldCheck className="size-4" /> Без приватных карточек</div>
              <h3 className="mt-3 text-2xl font-black text-[#1f1f1f]">{shareMutation.data.summary.headline}</h3>
              <p className="mt-2 text-sm leading-5 text-[#6f7377]">{shareMutation.data.summary.description}</p>
            </section>
            <div><p className="mb-2 text-xs font-bold text-[#6f7377]">Выберите карточки · {selectedCards.length}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {shareMutation.data.cards.map((card) => (
                <button aria-pressed={selectedIds.includes(card.id)} className="relative cursor-pointer rounded-2xl border border-[#e5e7e9] p-4 text-left transition aria-pressed:border-[#00aaff] aria-pressed:bg-[#eaf8ff]" key={card.id} onClick={() => toggleCard(card.id)} type="button">
                  {selectedIds.includes(card.id) && <Check className="absolute top-3 right-3 size-4 text-[#00aaff]" />}
                  <p className="text-sm font-bold text-[#1f1f1f]">{card.title}</p>
                  {card.value && <p className="mt-2 text-lg font-black text-[#965eeb]">{card.value}</p>}
                </button>
              ))}
            </div>
            </div>
            <p className="rounded-xl bg-[#f2f3f5] p-3 text-xs leading-5 text-[#6f7377]">Сейчас можно поделиться выбранными итогами как текстом или PNG.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button className="rounded-2xl" disabled={!selectedCards.length} onClick={() => downloadRecapShareImage(shareMutation.data!, selectedCards)} variant="outline"><Download />Скачать PNG</Button>
              <Button className="rounded-2xl bg-[#00aaff] text-white hover:bg-[#0099e6]" disabled={!selectedCards.length} onClick={share}>{shared ? <Check /> : <Send />}{shared ? 'Готово' : 'Поделиться текстом'}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
