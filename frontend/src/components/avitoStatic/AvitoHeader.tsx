import { ArrowLeft, Bell, Heart, MessageCircle, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PATHS } from '@/config/paths'

const links = ['◉ Для бизнеса⌄', 'Карьера в Авито', 'Помощь', 'Каталоги⌄', '#яПомогаю']

export function AvitoHeader() {
  return (
    <>
      <div className="avito-static-promo-top">
        <div className="avito-static-promo-copy">
          Получите кешбэк от Альфа-Банка за покупки с Авито Доставкой. <u>Подробнее</u>
        </div>
        <img alt="Картинка баннера" src="https://www.avito.st/static/ims/61ec3b14-2de3-4c92-bead-b7c8612c1b28_desktop_main_page_banner_v6_common_1492x240.png" />
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
