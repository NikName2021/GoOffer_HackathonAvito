import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { AVITO_BUSINESS, AVITO_IMAGE_FALLBACK } from '@/constants/avitoStatic'

export function AvitoBusiness() {
  return (
    <aside className="avito-static-business">
      <h2>Всё для бизнеса</h2>
      <p>Миллионы предложений для разных задач в Авито Бизнес 360</p>
      <div className="avito-static-business-grid">
        {AVITO_BUSINESS.map(([label, image]) => (
          <div key={label}>
            <ImageWithFallback
              alt=""
              fallbackSrc={AVITO_IMAGE_FALLBACK}
              loading="lazy"
              src={image}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="avito-static-business-button">◎ Искать в Бизнес 360</div>
    </aside>
  )
}
