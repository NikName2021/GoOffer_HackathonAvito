import { ArrowLeft, Bell, Heart, MessageCircle, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'

import marketplaceBanner from '@/assets/avito-demo/marketplace-banner.webp'
import marketplacePlaceholder from '@/assets/avito-demo/marketplace-placeholder.webp'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { PATHS } from '@/config/paths'

const links = ['◉ Для бизнеса⌄', 'Карьера в Авито', 'Помощь', 'Каталоги⌄', '#яПомогаю']

export function AvitoHeader() {
  return (
    <>
      <div className="avito-static-promo-top">
        <div className="avito-static-promo-copy">
          Находите нужное и давайте вещам новую жизнь. <u>Подробнее</u>
        </div>
        <ImageWithFallback
          alt="Подборка товаров для дома, хобби и путешествий"
          fallbackSrc={marketplacePlaceholder}
          src={marketplaceBanner}
        />
      </div>
      <header className="avito-static-header">
        <div className="avito-static-nav">
          <div className="avito-static-nav-left">
            <Link aria-label="Вернуться к профилям" className="avito-static-profiles-link" title="Вернуться к профилям" to={PATHS.HOME}>
              <ArrowLeft aria-hidden="true" />
            </Link>
            <div className="avito-static-nav-links">{links.map((link) => <span key={link}>{link}</span>)}</div>
          </div>
          <div className="avito-static-actions">
            <span className="avito-static-add">＋ Разместить объявление</span>
            <span>▣ Мои объявления</span>
            <Heart /><Bell /><MessageCircle /><ShoppingCart />
            <span className="avito-static-bonus">◆</span><b>25</b>
            <span className="avito-static-avatar">Н</span>
          </div>
        </div>
      </header>
    </>
  )
}
