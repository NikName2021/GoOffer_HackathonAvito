import { Trash2 } from 'lucide-react'

import { AdBaseFields } from './AdBaseFields'
import { CheckboxField, FormField, TextareaField } from './FormControls'
import type { CreateOwnAdRequest } from '@/types/profileRequest.type'

interface OwnAdEditorProps {
  ad: CreateOwnAdRequest
  index: number
  onChange: (ad: CreateOwnAdRequest) => void
  onRemove: () => void
}

export function OwnAdEditor({ ad, index, onChange, onRemove }: OwnAdEditorProps) {
  function toggleSold(isSold: boolean) {
    onChange(
      isSold
        ? { ...ad, isSold: true, soldAt: '' }
        : { ...ad, isSold: false, soldAt: undefined, review: undefined },
    )
  }

  return (
    <article className="rounded-2xl border border-[#e7e9eb] bg-[#fafafa] p-4">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#1f1f1f]">Объявление {index + 1}</p>
          <p className="text-[11px] text-[#8a8d91]">Собственное объявление пользователя</p>
        </div>
        <button
          aria-label={`Удалить объявление ${index + 1}`}
          className="grid size-8 place-items-center rounded-full text-[#8a8d91] hover:bg-[#fff0f2] hover:text-[#ff4053]"
          onClick={onRemove}
          type="button"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </button>
      </header>

      <AdBaseFields onChange={(patch) => onChange({ ...ad, ...patch })} value={ad} />

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <CheckboxField checked={ad.isArchived} onChange={(isArchived) => onChange({ ...ad, isArchived })}>
          Находится в архиве
        </CheckboxField>
        <CheckboxField checked={ad.isSold} onChange={toggleSold}>
          Товар продан
        </CheckboxField>
      </div>

      {ad.isSold && (
        <div className="mt-4 space-y-3 rounded-2xl border border-[#dcecf5] bg-white p-3">
          <FormField
            label="Дата продажи"
            onChange={(event) => onChange({ ...ad, soldAt: event.target.value })}
            required
            type="date"
            value={ad.soldAt}
          />
          <CheckboxField
            checked={Boolean(ad.review)}
            onChange={(hasReview) =>
              onChange({
                ...ad,
                review: hasReview ? { comment: '', rating: 5, createdAt: '' } : undefined,
              })
            }
          >
            Есть отзыв после продажи
          </CheckboxField>

          {ad.review && (
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Оценка"
                max="5"
                min="1"
                onChange={(event) =>
                  onChange({ ...ad, review: { ...ad.review!, rating: event.target.valueAsNumber || 1 } })
                }
                required
                type="number"
                value={ad.review.rating}
              />
              <FormField
                label="Дата отзыва"
                onChange={(event) =>
                  onChange({ ...ad, review: { ...ad.review!, createdAt: event.target.value } })
                }
                required
                type="date"
                value={ad.review.createdAt}
              />
              <TextareaField
                className="sm:col-span-2"
                label="Комментарий"
                onChange={(event) =>
                  onChange({ ...ad, review: { ...ad.review!, comment: event.target.value } })
                }
                required
                value={ad.review.comment}
              />
            </div>
          )}
        </div>
      )}
    </article>
  )
}
