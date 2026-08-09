import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { AVITO_CATEGORIES, AVITO_IMAGE_FALLBACK } from '@/constants/avitoStatic'

export function AvitoCategories() {
  return (
    <div className="avito-static-categories">
      {AVITO_CATEGORIES.map((category) => (
        <article className="avito-static-category" key={category.label}>
          <span>{category.label}</span>
          <ImageWithFallback
            alt={category.label}
            fallbackSrc={AVITO_IMAGE_FALLBACK}
            loading="lazy"
            src={category.image}
          />
        </article>
      ))}
    </div>
  )
}
