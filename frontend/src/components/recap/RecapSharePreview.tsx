import { Download, ExternalLink, LoaderCircle, Send, ShieldCheck } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'

import { RecapShareCardOption } from './RecapShareCardOption'
import { sendRecapEvent } from '@/api/recapEvents'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateRecapShare } from '@/hooks/useRecap'
import type { RecapResponse, RecapShareFormat } from '@/types/recap.type'
import { downloadRecapImage } from '@/utils/recapImageDownload'
import { getInitialShareCardIds, getShareableRecapCards, toggleShareCardId } from '@/utils/recapShareSelection'

interface RecapSharePreviewProps {
  recap: RecapResponse
}
const formatOptions = [
  { label: 'Обычная страница', value: 'responsive' },
  { label: 'История 9:16', value: 'mobile_story' },
] satisfies Array<{ label: string; value: RecapShareFormat }>

export function RecapSharePreview({ recap }: RecapSharePreviewProps) {
  const shareableCards = useMemo(() => getShareableRecapCards(recap.cards), [recap.cards])
  const [selectedIds, setSelectedIds] = useState(() => getInitialShareCardIds(recap.cards))
  const [format, setFormat] = useState<RecapShareFormat>('responsive')
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string>()
  const shareMutation = useCreateRecapShare()
  const shareCreatedSent = useRef(false)

  function trackShareCreated() {
    if (shareCreatedSent.current) return
    shareCreatedSent.current = true
    void sendRecapEvent({ event: 'share_created' })
  }
  function handleOpenChange(open: boolean) {
    if (!open) {
      shareMutation.reset()
      setDownloadError(undefined)
    }
  }
  async function download() {
    setDownloading(true)
    setDownloadError(undefined)
    try {
      const selectedCards = shareableCards.filter((card) => selectedIds.includes(card.id))
      const downloaded = await downloadRecapImage(selectedCards, recap.achievements, recap.year, format)
      if (!downloaded) setDownloadError('Не удалось подготовить изображение. Попробуйте ещё раз.')
      else trackShareCreated()
    } catch {
      setDownloadError('Не удалось скачать изображение. Попробуйте ещё раз.')
    } finally {
      setDownloading(false)
    }
  }
  function createAndOpen() {
    shareMutation.mutate({
      request: { card_ids: selectedIds, format },
      userId: recap.user_id,
      year: recap.year,
    }, {
      onSuccess: (created) => {
        trackShareCreated()
        window.location.assign(created.public_url)
      },
    })
  }

  const error = shareMutation.error instanceof Error ? shareMutation.error.message : undefined

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger aria-label="Поделиться" className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#eaf8ff] px-3 py-2 text-xs font-bold text-[#00aaff] hover:bg-[#dff4ff]">
        <Send aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">Поделиться</span>
      </DialogTrigger>
      <DialogContent className="max-h-[min(780px,calc(100dvh-2rem))] overflow-y-auto sm:max-w-3xl">
        <div className="pr-10">
          <DialogTitle className="text-xl font-black">Создать публичную ссылку</DialogTitle>
          <DialogDescription className="mt-2">
            Выберите до 9 безопасных карточек. Профиль, объявления и полный набор итогов не публикуются.
          </DialogDescription>
        </div>

        <section className="flex items-center gap-3 rounded-2xl bg-[#eaf8ff] p-4 text-sm text-[#007acc]">
          <ShieldCheck className="size-5 shrink-0" />
          Ссылка временная и содержит только выбранные обезличенные карточки.
        </section>

        <label className="block text-sm font-bold text-[#1f1f1f]">
          Формат публикации
          <Select
            items={formatOptions}
            onValueChange={(value) => value && setFormat(value)}
            value={format}
          >
            <SelectTrigger className="mt-2 h-11" aria-label="Формат публикации">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formatOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-[#1f1f1f]">Карточки для публикации</p>
            <span className="rounded-full bg-[#eaf8ff] px-3 py-1 text-xs font-bold text-[#00aaff]">
              {selectedIds.length} из {Math.min(shareableCards.length, 9)}
            </span>
          </div>
          {shareableCards.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {shareableCards.map((card) => (
                <RecapShareCardOption
                  card={card}
                  key={card.id}
                  onToggle={() => setSelectedIds((ids) => toggleShareCardId(ids, card.id))}
                  selected={selectedIds.includes(card.id)}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-[#f2f3f5] p-4 text-sm text-[#6f7377]">Нет карточек, разрешённых для публикации.</p>
          )}
        </div>

        {(error || downloadError) && <p className="rounded-2xl bg-[#fff0f2] p-4 text-sm text-[#ff4053]">{downloadError ?? error}</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          <Button className="h-12 rounded-2xl" disabled={selectedIds.length === 0 || downloading} onClick={() => void download()} variant="outline">
            {downloading ? <LoaderCircle className="animate-spin" /> : <Download />}
            {downloading ? 'Готовим PNG…' : 'Скачать PNG'}
          </Button>
          <Button
            className="h-12 rounded-2xl bg-[#00aaff] text-white hover:bg-[#0099e6]"
            disabled={selectedIds.length === 0 || shareMutation.isPending}
            onClick={createAndOpen}
          >
            {shareMutation.isPending ? <LoaderCircle className="animate-spin" /> : <ExternalLink />}
            Создать ссылку
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
