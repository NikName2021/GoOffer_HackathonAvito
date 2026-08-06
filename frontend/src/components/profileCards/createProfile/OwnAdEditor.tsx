import { ChevronDown, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { AdBaseFields } from './AdBaseFields'
import { CheckboxField, FormField, TextareaField } from './FormControls'
import { OwnAdEngagementFields } from './OwnAdEngagementFields'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { CreateOwnAdRequest } from '@/types/profileRequest.type'
import { formatCount } from '@/utils/formatterNumber'

interface OwnAdEditorProps {
  ad: CreateOwnAdRequest
  index: number
  onChange: (ad: CreateOwnAdRequest) => void
  onRemove: () => void
}

export function OwnAdEditor({ ad, index, onChange, onRemove }: OwnAdEditorProps) {
  const [isOpen, setIsOpen] = useState(false)

  function toggleSold(isSold: boolean) {
    onChange(
      isSold
        ? { ...ad, isSold: true, soldAt: '' }
        : { ...ad, isSold: false, soldAt: undefined, review: undefined },
    )
  }

  return (
    <Collapsible className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-[#fafafa]" onOpenChange={setIsOpen} open={isOpen}>
      <header className="flex items-center gap-2 px-4 py-3">
        <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-3 text-left" type="button">
          <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-[#8a8d91] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-[#1f1f1f]">{ad.title.trim() || `Объявление ${index + 1}`}</span>
            <span className="block truncate text-[11px] text-[#8a8d91]">
              {ad.category.trim() || 'Категория не указана'} · {ad.favoritesCount} в избранном · {formatCount(ad.contactsCount, ['контакт', 'контакта', 'контактов'])}
            </span>
          </span>
        </CollapsibleTrigger>
        <button
          aria-label={`Удалить объявление ${index + 1}`}
          className="grid size-8 shrink-0 place-items-center rounded-full text-[#8a8d91] hover:bg-[#fff0f2] hover:text-[#ff4053]"
          onClick={onRemove}
          type="button"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </button>
      </header>

      <CollapsibleContent className="border-t border-[#e7e9eb] px-4 pt-4 pb-4">
        <AdBaseFields onChange={(patch) => onChange({ ...ad, ...patch })} value={ad} />
        <div className="mt-4">
          <OwnAdEngagementFields ad={ad} onChange={onChange} />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <CheckboxField checked={ad.isArchived} onChange={(isArchived) => onChange({ ...ad, isArchived })}>Находится в архиве</CheckboxField>
          <CheckboxField checked={ad.isSold} onChange={toggleSold}>Товар продан</CheckboxField>
        </div>

        {ad.isSold && (
          <div className="mt-4 space-y-3 rounded-2xl border border-[#dcecf5] bg-white p-3">
            <FormField label="Дата продажи" onChange={(event) => onChange({ ...ad, soldAt: event.target.value })} required type="date" value={ad.soldAt} />
            <CheckboxField
              checked={Boolean(ad.review)}
              onChange={(hasReview) => onChange({ ...ad, review: hasReview ? { comment: '', rating: 5, createdAt: '' } : undefined })}
            >
              Есть отзыв после продажи
            </CheckboxField>

            {ad.review && (
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Оценка" max="5" min="1" onChange={(event) => onChange({ ...ad, review: { ...ad.review!, rating: event.target.valueAsNumber || 1 } })} required type="number" value={ad.review.rating} />
                <FormField label="Дата отзыва" onChange={(event) => onChange({ ...ad, review: { ...ad.review!, createdAt: event.target.value } })} required type="date" value={ad.review.createdAt} />
                <TextareaField className="sm:col-span-2" label="Комментарий" onChange={(event) => onChange({ ...ad, review: { ...ad.review!, comment: event.target.value } })} required value={ad.review.comment} />
              </div>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
