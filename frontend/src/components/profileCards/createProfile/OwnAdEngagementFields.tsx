import { CalendarDays, Heart, MapPin, MessageCircle } from 'lucide-react'

import { FormField } from './FormControls'
import type { CreateOwnAdRequest } from '@/types/profileRequest.type'

interface OwnAdEngagementFieldsProps {
  ad: CreateOwnAdRequest
  onChange: (ad: CreateOwnAdRequest) => void
}

export function OwnAdEngagementFields({ ad, onChange }: OwnAdEngagementFieldsProps) {
  return (
    <section className="rounded-2xl border border-[#dcecf5] bg-[#f7fcff] p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1f1f1f]">
        <MessageCircle className="size-4 text-[#00aaff]" />
        Активность объявления
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField icon={CalendarDays} label="Дата публикации" onChange={(event) => onChange({ ...ad, publishedAt: event.target.value })} required type="date" value={ad.publishedAt} />
        <FormField icon={MapPin} label="Город" maxLength={100} onChange={(event) => onChange({ ...ad, city: event.target.value })} placeholder="Например, Москва" value={ad.city ?? ''} />
        <FormField icon={Heart} label="Добавили в избранное" min="0" onChange={(event) => onChange({ ...ad, favoritesCount: event.target.valueAsNumber || 0 })} required type="number" value={ad.favoritesCount} />
        <FormField icon={MessageCircle} label="Открыли контакты" min="0" onChange={(event) => onChange({ ...ad, contactsCount: event.target.valueAsNumber || 0 })} required type="number" value={ad.contactsCount} />
      </div>
    </section>
  )
}
