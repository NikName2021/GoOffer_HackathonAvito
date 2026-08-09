import { Heart, PackageOpen } from 'lucide-react'

import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { AVITO_IMAGE_FALLBACK } from '@/constants/avitoStatic'

export interface AvitoCatalogItem {
  id: string
  image?: string
  meta?: string
  price: string
  title: string
}

interface AvitoCatalogPageProps {
  description: string
  items: AvitoCatalogItem[]
  title: string
}

export function AvitoCatalogPage({ description, items, title }: AvitoCatalogPageProps) {
  return (
    <section className="avito-mock-section">
      <header className="avito-mock-heading">
        <span>Avito</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>

      {items.length > 0 ? (
        <div className="avito-mock-grid">
          {items.map((item) => (
            <article className="avito-mock-card" key={item.id}>
              <div className="avito-mock-card-image">
                {item.image ? (
                  <ImageWithFallback
                    alt={item.title}
                    fallbackSrc={AVITO_IMAGE_FALLBACK}
                    loading="lazy"
                    src={item.image}
                  />
                ) : (
                  <PackageOpen aria-hidden="true" />
                )}
                <Heart aria-hidden="true" className="avito-mock-card-heart" />
              </div>
              <h2>{item.title}</h2>
              <strong>{item.price}</strong>
              {item.meta && <p>{item.meta}</p>}
            </article>
          ))}
        </div>
      ) : (
        <div className="avito-mock-empty">
          <PackageOpen aria-hidden="true" />
          <strong>Здесь пока ничего нет</strong>
          <span>Новые объявления появятся в этом разделе.</span>
        </div>
      )}
    </section>
  )
}
