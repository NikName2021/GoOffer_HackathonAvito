import marketplaceBanner from '@/assets/avito-demo/marketplace-banner.webp'
import marketplacePlaceholder from '@/assets/avito-demo/marketplace-placeholder.webp'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'

export function AvitoPromo() {
  return (
    <div className="avito-static-main-promo">
      <ImageWithFallback
        alt="Подборка вещей, которым можно дать новую жизнь"
        fallbackSrc={marketplacePlaceholder}
        src={marketplaceBanner}
      />
      <div className="avito-static-main-promo-copy">
        <strong>Открывайте хорошую историю</strong>
        <span>Находите нужное рядом</span>
      </div>
    </div>
  )
}
