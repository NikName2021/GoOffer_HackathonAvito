import { Bookmark, CirclePlus, Heart, LayoutGrid, MessageCircle, Search, Sparkles } from 'lucide-react'
import { useLocation, useSearchParams } from 'react-router-dom'

import { PATHS } from '@/config/paths'

const destinations = [
  { match: '/favorites', title: 'Избранное', description: 'Сохранённые объявления', Icon: Heart },
  { match: '/messages', title: 'Сообщения', description: 'Ваши диалоги на Авито', Icon: MessageCircle },
  { match: '/create', title: 'Новое объявление', description: 'Форма размещения объявления', Icon: CirclePlus },
  { match: '/recommendations', title: 'Рекомендации', description: 'Подборка на основе ваших интересов', Icon: Sparkles },
  { match: '/my/items/', title: 'Ваше объявление', description: 'Карточка объявления из профиля', Icon: Bookmark },
  { match: '/my/items', title: 'Мои объявления', description: 'Опубликованные и архивные объявления', Icon: LayoutGrid },
  { match: '/items/', title: 'Объявление', description: 'Карточка выбранного товара', Icon: Bookmark },
] as const

export function AvitoDestinationBanner() {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const relativePath = pathname.slice(PATHS.AVITO.length)

  if (relativePath.startsWith('/search')) {
    const category = searchParams.get('category')?.trim()
    return (
      <aside className="avito-static-destination">
        <Search aria-hidden="true" />
        <div><strong>{category || 'Результаты поиска'}</strong><span>Объявления в выбранной категории</span></div>
      </aside>
    )
  }

  const destination = destinations.find(({ match }) => relativePath.startsWith(match))
  if (!destination) return null

  const { Icon, description, title } = destination
  return (
    <aside className="avito-static-destination">
      <Icon aria-hidden="true" />
      <div><strong>{title}</strong><span>{description}</span></div>
    </aside>
  )
}
