import { Plus } from 'lucide-react'

import { JsonImportButton } from './JsonImportButton'
import { OwnAdEditor } from './OwnAdEditor'
import { parseOwnAdsJson } from './parseActivityJson'
import type { CreateOwnAdRequest } from '@/types/profileRequest.type'

interface OwnAdsFormSectionProps {
  ads: CreateOwnAdRequest[]
  onAdd: () => void
  onChange: (index: number, ad: CreateOwnAdRequest) => void
  onImport: (ads: CreateOwnAdRequest[]) => void
  onRemove: (index: number) => void
}

export function OwnAdsFormSection({ ads, onAdd, onChange, onImport, onRemove }: OwnAdsFormSectionProps) {
  return (
    <section>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#1f1f1f]">Все объявления</h3>
          <p className="mt-1 text-xs text-[#8a8d91]">Добавляйте вручную или загружайте массив объектов из JSON.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <JsonImportButton onImport={onImport} parse={parseOwnAdsJson} />
          <button
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#e8f6ff] px-3 py-2 text-xs font-semibold text-[#00aaff] hover:bg-[#d9f0ff]"
            onClick={onAdd}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" />
            Добавить
          </button>
        </div>
      </header>

      {ads.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#dfe1e3] px-5 py-12 text-center">
          <p className="text-sm font-semibold text-[#6f7377]">Объявлений пока нет</p>
          <p className="mt-1 text-xs text-[#a1a4a7]">Добавьте одно объявление или загрузите JSON-файл.</p>
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
