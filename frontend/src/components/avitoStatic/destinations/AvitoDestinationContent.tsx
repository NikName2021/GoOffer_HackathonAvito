import { useLocation, useSearchParams } from 'react-router-dom'

import { AvitoCatalogPage, type AvitoCatalogItem } from './AvitoCatalogPage'
import { AvitoCreateListingPage } from './AvitoCreateListingPage'
import { AvitoListingPage } from './AvitoListingPage'
import { AvitoMessagesPage } from './AvitoMessagesPage'
import { PATHS } from '@/config/paths'
import { AVITO_PRODUCTS } from '@/constants/avitoStatic'
import { useProfileDetails } from '@/hooks/useProfiles'
import type { CreateOwnAdRequest } from '@/types/profileRequest.type'
import type { ViewedAdResponse } from '@/types/profileResponse.type'
import { formatCurrency } from '@/utils/formatterNumber'

function getMockImage(adId: string) {
  const hash = [...adId].reduce((total, character) => total + character.charCodeAt(0), 0)
  return AVITO_PRODUCTS[hash % AVITO_PRODUCTS.length]?.image
}

function toCatalogItem(item: CreateOwnAdRequest | ViewedAdResponse): AvitoCatalogItem {
  return {
    id: item.adId,
    image: item.imageUrl?.trim() || getMockImage(item.adId),
    meta: `${item.category}${item.subcategory ? ` · ${item.subcategory}` : ''}`,
    price: formatCurrency(item.price),
    title: item.title,
  }
}

const recommendations: AvitoCatalogItem[] = AVITO_PRODUCTS.slice(0, 12).map((item, index) => ({
  id: `recommendation-${index}`,
  image: item.image,
  meta: index % 2 === 0 ? 'С Avito Доставкой' : 'Краснодар',
  price: item.price,
  title: item.title,
}))

export function AvitoDestinationContent() {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const profileId = searchParams.get('profileId') ?? undefined
  const profileQuery = useProfileDetails(profileId)
  const profile = profileQuery.data
  const relativePath = pathname.slice(PATHS.AVITO.length)
  const ownItems = (profile?.ownAds ?? []).map(toCatalogItem)
  const viewedItems = (profile?.views ?? []).map(toCatalogItem)

  if (relativePath.startsWith('/messages')) return <AvitoMessagesPage />
  if (relativePath.startsWith('/create')) return <AvitoCreateListingPage />

  if (relativePath.startsWith('/favorites')) {
    const favoriteIds = new Set((profile?.views ?? []).filter((item) => item.isFavorite).map((item) => item.adId))
    return <AvitoCatalogPage description="Объявления, которые вы сохранили на потом." items={viewedItems.filter((item) => favoriteIds.has(item.id))} title="Избранное" />
  }

  if (relativePath.startsWith('/recommendations')) {
    return <AvitoCatalogPage description="Подборка на основе ваших просмотров и любимых категорий." items={recommendations} title="Рекомендации для вас" />
  }

  if (relativePath.startsWith('/delivery')) {
    return <AvitoCatalogPage description="Товары, которые можно безопасно получить с Авито Доставкой." items={recommendations.filter((_, index) => index % 2 === 0)} title="Товары с Авито Доставкой" />
  }

  if (relativePath === '/my/items' || relativePath === '/my/items/') {
    return <AvitoCatalogPage description="Активные, проданные и архивные объявления профиля." items={ownItems} title="Мои объявления" />
  }

  if (relativePath.startsWith('/my/items/')) {
    const adId = decodeURIComponent(relativePath.replace('/my/items/', ''))
    return <AvitoListingPage item={ownItems.find((item) => item.id === adId) ?? ownItems[0] ?? recommendations[0]} own />
  }

  if (relativePath.startsWith('/items/')) {
    const adId = decodeURIComponent(relativePath.replace('/items/', ''))
    return <AvitoListingPage item={[...viewedItems, ...ownItems].find((item) => item.id === adId) ?? recommendations[0]} />
  }

  const category = searchParams.get('category')?.trim() || 'Все категории'
  const profileItems = [...viewedItems, ...ownItems].filter((item) => category === 'Все категории' || item.meta?.toLocaleLowerCase().includes(category.toLocaleLowerCase()))
  return <AvitoCatalogPage description="Объявления в выбранной категории." items={profileItems.length > 0 ? profileItems : recommendations} title={category} />
}
