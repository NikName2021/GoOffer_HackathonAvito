import { FormField } from './FormControls'
import { ImageUploadField } from './ImageUploadField'
import type { CreateOwnAdRequest } from '@/types/profileRequest.type'

type AdBaseValue = Pick<
  CreateOwnAdRequest,
  'title' | 'category' | 'subcategory' | 'imageUrl' | 'price' | 'viewCount'
>

interface AdBaseFieldsProps {
  onChange: (patch: Partial<AdBaseValue>) => void
  value: AdBaseValue
}

export function AdBaseFields({ onChange, value }: AdBaseFieldsProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          label="Название"
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="Например, смартфон"
          required
          value={value.title}
        />
        <FormField
          label="Категория"
          onChange={(event) => onChange({ category: event.target.value })}
          placeholder="Электроника"
          required
          value={value.category}
        />
        <FormField
          label="Подкатегория"
          onChange={(event) => onChange({ subcategory: event.target.value })}
          placeholder="Смартфоны"
          value={value.subcategory ?? ''}
        />
        <FormField
          label="Цена, ₽"
          min="0"
          onChange={(event) => onChange({ price: event.target.valueAsNumber || 0 })}
          required
          type="number"
          value={value.price}
        />
        <FormField
          label="Общие просмотры объявления"
          min="0"
          onChange={(event) => onChange({ viewCount: event.target.valueAsNumber || 0 })}
          required
          type="number"
          value={value.viewCount}
        />
      </div>
      <ImageUploadField
        label="Фотография объявления"
        onChange={(imageUrl) => onChange({ imageUrl })}
        value={value.imageUrl}
      />
    </div>
  )
}
