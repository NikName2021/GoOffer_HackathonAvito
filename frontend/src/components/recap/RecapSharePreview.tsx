import { Check, Download, LoaderCircle, Send, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

import { RecapShareCardOption } from './RecapShareCardOption'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useShareRecap } from '@/hooks/useRecap'
import type { RecapCardResponse, RecapResponse, ShareRecapResponse } from '@/types/recap.type'
import { downloadRecapShareImage } from '@/utils/recapShareImage'

interface RecapSharePreviewProps {
  recap: RecapResponse
}

function buildShareText(data: ShareRecapResponse, cards: RecapCardResponse[]) {
  const highlights = cards.map((card) => `• ${card.title}${card.value ? ` — ${card.value}` : ''}`)
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
      <DialogContent className="max-h-[min(760px,calc(100dvh-2rem))] overflow-y-auto sm:max-w-3xl">
        <div className="pr-10">
          <DialogTitle className="text-xl font-black">Предпросмотр публикации</DialogTitle>
          <DialogDescription className="mt-2">Выберите моменты, которые хотите сохранить или отправить друзьям.</DialogDescription>
        </div>

        {shareMutation.isPending && <div className="grid min-h-52 place-items-center"><LoaderCircle className="size-8 animate-spin text-[#00aaff]" /></div>}
        {error && <div className="rounded-2xl bg-[#fff0f2] p-4 text-sm text-[#ff4053]">{error}</div>}
        {shareMutation.data && (
          <div className="space-y-4">
            <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#f1eafd] via-[#eef9ff] to-[#e9fbf2] p-6">
              <span aria-hidden="true" className="absolute -top-16 -right-12 size-44 rounded-full bg-white/45" />
              <div className="relative flex items-center gap-2 text-xs font-bold text-[#00aaff]"><ShieldCheck className="size-4" /> Без приватных данных</div>
              <h3 className="relative mt-4 max-w-xl text-3xl leading-8 font-black tracking-[-0.03em] text-[#1f1f1f]">{shareMutation.data.summary.headline}</h3>
              <p className="relative mt-2 max-w-xl text-sm leading-5 text-[#6f7377]">{shareMutation.data.summary.description}</p>
            </section>
            <div>
              <div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm font-bold text-[#1f1f1f]">Выберите карточки</p><span className="rounded-full bg-[#eaf8ff] px-3 py-1 text-xs font-bold text-[#00aaff]">{selectedCards.length} из {shareMutation.data.cards.length}</span></div>
              <div className="grid gap-3 sm:grid-cols-2">
                {shareMutation.data.cards.map((card) => <RecapShareCardOption card={card} key={card.id} onToggle={() => toggleCard(card.id)} selected={selectedIds.includes(card.id)} />)}
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
