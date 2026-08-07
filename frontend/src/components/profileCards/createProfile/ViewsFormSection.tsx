import { Plus } from 'lucide-react'

import { JsonImportButton } from './JsonImportButton'
import { parseViewedAdsJson } from './parseActivityJson'
import { ViewedAdEditor } from './ViewedAdEditor'
import type { CreateViewedAdRequest } from '@/types/profileRequest.type'

interface ViewsFormSectionProps {
  onAdd: () => void
  onChange: (index: number, view: CreateViewedAdRequest) => void
  onImport: (views: CreateViewedAdRequest[]) => void
  onRemove: (index: number) => void
  views: CreateViewedAdRequest[]
}

export function ViewsFormSection({ onAdd, onChange, onImport, onRemove, views }: ViewsFormSectionProps) {
  return (
    <section>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#1f1f1f]">Все просмотры</h3>
          <p className="mt-1 text-xs text-[#8a8d91]">Добавляйте вручную или загружайте JSON — до 10 000 объектов.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <JsonImportButton onImport={onImport} parse={parseViewedAdsJson} />
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

      {views.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#dfe1e3] px-5 py-12 text-center">
          <p className="text-sm font-semibold text-[#6f7377]">Просмотров пока нет</p>
          <p className="mt-1 text-xs text-[#a1a4a7]">Добавьте один просмотр или загрузите JSON-файл.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {views.map((view, index) => (
            <ViewedAdEditor
              index={index}
              key={index}
              onChange={(nextView) => onChange(index, nextView)}
              onRemove={() => onRemove(index)}
              view={view}
            />
          ))}
        </div>
      )}
    </section>
  )
}
