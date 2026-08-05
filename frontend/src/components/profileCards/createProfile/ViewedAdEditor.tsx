import { ChevronDown, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { AdBaseFields } from './AdBaseFields'
import { CheckboxField, FormField } from './FormControls'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { CreateViewedAdRequest } from '@/types/profileRequest.type'

interface ViewedAdEditorProps {
  index: number
  onChange: (view: CreateViewedAdRequest) => void
  onRemove: () => void
  view: CreateViewedAdRequest
}

export function ViewedAdEditor({ index, onChange, onRemove, view }: ViewedAdEditorProps) {
  const [isOpen, setIsOpen] = useState(false)

  function updateLastViewedAt(lastViewedAt: string) {
    onChange(view.isPurchased ? { ...view, lastViewedAt, purchasedAt: lastViewedAt } : { ...view, lastViewedAt })
  }

  function toggleFavorite(isFavorite: boolean) {
    onChange(isFavorite ? { ...view, isFavorite: true, favoritedAt: view.lastViewedAt } : { ...view, isFavorite: false, favoritedAt: undefined })
  }

  function togglePurchased(isPurchased: boolean) {
    onChange(isPurchased ? { ...view, isPurchased: true, purchasedAt: view.lastViewedAt } : { ...view, isPurchased: false, purchasedAt: undefined })
  }

  return (
    <Collapsible className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-[#fafafa]" onOpenChange={setIsOpen} open={isOpen}>
      <header className="flex items-center gap-2 px-4 py-3">
        <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-3 text-left" type="button">
          <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-[#8a8d91] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-[#1f1f1f]">{view.title.trim() || `Просмотр ${index + 1}`}</span>
            <span className="block truncate text-[11px] text-[#8a8d91]">{view.category.trim() || 'Категория не указана'}</span>
          </span>
        </CollapsibleTrigger>
        <button
          aria-label={`Удалить просмотр ${index + 1}`}
          className="grid size-8 shrink-0 place-items-center rounded-full text-[#8a8d91] hover:bg-[#fff0f2] hover:text-[#ff4053]"
          onClick={onRemove}
          type="button"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </button>
      </header>

      <CollapsibleContent className="border-t border-[#e7e9eb] px-4 pt-4 pb-4">
        <AdBaseFields onChange={(patch) => onChange({ ...view, ...patch })} value={view} />
        <div className="mt-4">
          <FormField label="Дата и время последнего просмотра" onChange={(event) => updateLastViewedAt(event.target.value)} required type="datetime-local" value={view.lastViewedAt} />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <CheckboxField checked={view.isFavorite} onChange={toggleFavorite}>Добавлено в избранное</CheckboxField>
          <CheckboxField checked={view.isPurchased} onChange={togglePurchased}>Совершена покупка</CheckboxField>
        </div>

        {(view.isFavorite || view.isPurchased) && (
          <div className="mt-3 grid gap-3 rounded-2xl border border-[#dcecf5] bg-white p-3 sm:grid-cols-2">
            {view.isFavorite && <FormField label="Дата добавления в избранное" onChange={(event) => onChange({ ...view, favoritedAt: event.target.value })} required type="datetime-local" value={view.favoritedAt} />}
            {view.isPurchased && <FormField disabled label="Дата покупки" title="Совпадает с датой последнего просмотра" type="datetime-local" value={view.purchasedAt} />}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
