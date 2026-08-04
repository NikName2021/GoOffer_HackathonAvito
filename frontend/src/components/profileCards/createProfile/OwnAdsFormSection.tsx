import { Plus } from 'lucide-react'

import { OwnAdEditor } from './OwnAdEditor'
import type { CreateOwnAdRequest } from '@/types/profileRequest.type'

interface OwnAdsFormSectionProps {
  ads: CreateOwnAdRequest[]
  onAdd: () => void
  onChange: (index: number, ad: CreateOwnAdRequest) => void
  onRemove: (index: number) => void
}

export function OwnAdsFormSection({ ads, onAdd, onChange, onRemove }: OwnAdsFormSectionProps) {
  return (
    <section>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#1f1f1f]">Все объявления</h3>
          <p className="mt-1 text-xs text-[#8a8d91]">Добавляйте, редактируйте и удаляйте объявления.</p>
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#e8f6ff] px-3 py-2 text-xs font-semibold text-[#00aaff] hover:bg-[#d9f0ff]"
          onClick={onAdd}
          type="button"
        >
          <Plus aria-hidden="true" className="size-4" />
          Добавить
        </button>
      </header>

      {ads.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#dfe1e3] px-5 py-12 text-center">
          <p className="text-sm font-semibold text-[#6f7377]">Объявлений пока нет</p>
          <p className="mt-1 text-xs text-[#a1a4a7]">Нажмите «Добавить», чтобы создать первое.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map((ad, index) => (
            <OwnAdEditor
              ad={ad}
              index={index}
              key={index}
              onChange={(nextAd) => onChange(index, nextAd)}
              onRemove={() => onRemove(index)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
