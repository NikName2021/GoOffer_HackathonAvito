import type {
  CreateOwnAdRequest,
  CreateProfileRequest,
  CreateViewedAdRequest,
} from '@/types/profileRequest.type'
import type {
  GetProfileResponse,
  ProfilePurchaseResponse,
  ProfileSaleResponse,
} from '@/types/profileResponse.type'

type PurchasedAd = CreateViewedAdRequest & { isPurchased: true; purchasedAt: string }
type SoldAd = CreateOwnAdRequest & { isSold: true; soldAt: string }

function isPurchased(ad: CreateViewedAdRequest): ad is PurchasedAd {
  return ad.isPurchased
}

function isSold(ad: CreateOwnAdRequest): ad is SoldAd {
  return ad.isSold
}

function getFavoriteCategory(purchases: ProfilePurchaseResponse[]) {
  if (purchases.length === 0) return null

  const categoryCounts = purchases.reduce<Record<string, number>>((counts, purchase) => {
    counts[purchase.category] = (counts[purchase.category] ?? 0) + 1
    return counts
  }, {})

  return Object.entries(categoryCounts).sort(([, first], [, second]) => second - first)[0]?.[0] ?? null
}

function getByPrice<T extends { price: number }>(items: T[], direction: 'highest' | 'lowest') {
  if (items.length === 0) return null

  return items.reduce((selected, item) => {
    const shouldReplace = direction === 'highest' ? item.price > selected.price : item.price < selected.price
    return shouldReplace ? item : selected
  })
}

/** Имитирует агрегацию бэкенда только для локальных тестовых данных. */
export function createMockProfileResponse(profile: CreateProfileRequest, id: string): GetProfileResponse {
  const purchases: ProfilePurchaseResponse[] = profile.views.filter(isPurchased).map((purchase) => ({
    title: purchase.title,
    category: purchase.category,
    subcategory: purchase.subcategory,
    imageUrl: purchase.imageUrl,
    price: purchase.price,
    purchasedAt: purchase.purchasedAt,
  }))

  const sales: ProfileSaleResponse[] = profile.ownAds.filter(isSold).map((sale) => ({
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
    stats: {
      likes: profile.likes,
      chatsCount: profile.chatsCount,
      purchasesCount: purchases.length,
      salesCount: sales.length,
      totalViewCount: profile.views.reduce((total, view) => total + view.viewCount, 0),
      totalSpent: purchases.reduce((total, purchase) => total + purchase.price, 0),
      totalEarned: sales.reduce((total, sale) => total + sale.price, 0),
      reviewsCount: ratings.length,
      averageRating: ratings.length
        ? ratings.reduce((total, rating) => total + rating, 0) / ratings.length
        : null,
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
