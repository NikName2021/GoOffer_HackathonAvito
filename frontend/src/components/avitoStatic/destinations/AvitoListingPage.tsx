import { Heart, MapPin, ShieldCheck } from 'lucide-react'

import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { AVITO_IMAGE_FALLBACK } from '@/constants/avitoStatic'

import type { AvitoCatalogItem } from './AvitoCatalogPage'

interface AvitoListingPageProps {
  item: AvitoCatalogItem
  own?: boolean
}

export function AvitoListingPage({ item, own = false }: AvitoListingPageProps) {
  return (
    <article className="avito-mock-listing">
      <div className="avito-mock-listing-image">
        {item.image ? (
          <ImageWithFallback
            alt={item.title}
            fallbackSrc={AVITO_IMAGE_FALLBACK}
            src={item.image}
          />
        ) : (
          <span>Фото объявления</span>
        )}
      </div>
      <div className="avito-mock-listing-info">
        <span className="avito-mock-listing-badge">{own ? 'Ваше объявление' : 'Объявление Avito'}</span>
        <h1>{item.title}</h1>
        <strong>{item.price}</strong>
        <p>{item.meta || 'Товар в хорошем состоянии. Подробности можно уточнить в сообщениях.'}</p>
        <div><MapPin aria-hidden="true" />Краснодар</div>
        <div><ShieldCheck aria-hidden="true" />Безопасная сделка с Avito Доставкой</div>
        <button disabled type="button">{own ? 'Редактировать' : 'Написать продавцу'}</button>
        <button className="avito-mock-secondary" disabled type="button"><Heart aria-hidden="true" />В избранное</button>
      </div>
    </article>
  )
}
