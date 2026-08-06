import type { CreateOwnAdRequest, CreateProfileRequest, CreateViewedAdRequest } from '@/types/profileRequest.type'
import type { GetProfileResponse, ProfilePurchaseResponse, ProfileSaleResponse, ViewedAdResponse } from '@/types/profileResponse.type'

type SoldAd = CreateOwnAdRequest & { isSold: true; soldAt: string }

function isSold(ad: CreateOwnAdRequest): ad is SoldAd {
  return ad.isSold
}

function getEvent(view: CreateViewedAdRequest, type: 'buy' | 'like') {
  return view.viewedAt.find((event) => event.type === type)
}

function getFavoriteCategory(purchases: ProfilePurchaseResponse[]) {
  if (purchases.length === 0) return null
  const counts = purchases.reduce<Record<string, number>>((result, purchase) => {
    result[purchase.category] = (result[purchase.category] ?? 0) + 1
    return result
  }, {})
  return Object.entries(counts).sort(([, first], [, second]) => second - first)[0]?.[0] ?? null
}

function getByPrice<T extends { price: number }>(items: T[], direction: 'highest' | 'lowest') {
  if (items.length === 0) return null
  return items.reduce((selected, item) => {
    const replace = direction === 'highest' ? item.price > selected.price : item.price < selected.price
    return replace ? item : selected
  })
}

function toViewedResponse(view: CreateViewedAdRequest): ViewedAdResponse {
  const watches = view.viewedAt.filter((event) => event.type === 'watch')
  const favorite = getEvent(view, 'like')
  const purchase = getEvent(view, 'buy')
  return {
    ...view,
    lastViewedAt: watches.at(-1)?.time,
    isFavorite: Boolean(favorite),
    favoritedAt: favorite?.time,
    isPurchased: Boolean(purchase),
    purchasedAt: purchase?.time,
  }
}

/** Имитирует агрегацию backend только для локальных демонстрационных данных. */
export function createMockProfileResponse(profile: CreateProfileRequest, id: string): GetProfileResponse {
  const purchases: ProfilePurchaseResponse[] = profile.views.flatMap((view) => {
    const purchase = getEvent(view, 'buy')
    return purchase ? [{ adId: view.adId, title: view.title, category: view.category, subcategory: view.subcategory, imageUrl: view.imageUrl, price: view.price, purchasedAt: purchase.time }] : []
  })
  const sales: ProfileSaleResponse[] = profile.ownAds.filter(isSold).map((sale) => ({
    adId: sale.adId,
    title: sale.title,
    category: sale.category,
    subcategory: sale.subcategory,
    imageUrl: sale.imageUrl,
    price: sale.price,
    soldAt: sale.soldAt,
    viewCount: sale.viewCount,
    review: sale.review ?? null,
  }))
  const ratings = sales.flatMap((sale) => (sale.review ? [sale.review.rating] : []))

  return {
    id,
    name: profile.name,
    joinedAt: profile.joinedAt,
    avatarUrl: profile.avatarUrl,
    views: profile.views.map(toViewedResponse),
    ownAds: profile.ownAds,
    stats: {
      likes: profile.likes,
      chatsCount: profile.chatsCount,
      purchasesCount: purchases.length,
      salesCount: sales.length,
      totalViewCount: profile.views.reduce((total, view) => total + view.viewCount, 0),
      totalSpent: purchases.reduce((total, purchase) => total + purchase.price, 0),
      totalEarned: sales.reduce((total, sale) => total + sale.price, 0),
      reviewsCount: ratings.length,
      averageRating: ratings.length ? ratings.reduce((total, rating) => total + rating, 0) / ratings.length : null,
    },
    highlights: {
      favoriteCategory: getFavoriteCategory(purchases),
      mostExpensivePurchase: getByPrice(purchases, 'highest'),
      leastExpensivePurchase: getByPrice(purchases, 'lowest'),
      mostExpensiveSale: getByPrice(sales, 'highest'),
      leastExpensiveSale: getByPrice(sales, 'lowest'),
    },
    purchases,
    sales,
  }
}
