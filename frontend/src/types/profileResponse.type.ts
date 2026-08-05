interface ProfileActivityResponseBase {
  title: string
  category: string
  subcategory?: string
  imageUrl?: string
  price: number
}

export interface ProfileReviewResponse {
  comment: string
  rating: number
  createdAt: string
}

export interface ProfilePurchaseResponse extends ProfileActivityResponseBase {
  purchasedAt: string
}

export interface ProfileSaleResponse extends ProfileActivityResponseBase {
  soldAt: string
  viewCount: number
  review: ProfileReviewResponse | null
}

export interface ProfileStatsResponse {
  likes: number
  chatsCount: number
  purchasesCount: number
  salesCount: number
  totalViewCount: number
  totalSpent: number
  totalEarned: number
  reviewsCount: number
  averageRating: number | null
}

export interface ProfileHighlightsResponse {
  favoriteCategory: string | null
  mostExpensivePurchase: ProfilePurchaseResponse | null
  leastExpensivePurchase: ProfilePurchaseResponse | null
  mostExpensiveSale: ProfileSaleResponse | null
  leastExpensiveSale: ProfileSaleResponse | null
}

/** Ответ GET-запроса с уже рассчитанными бэкендом итогами профиля. */
export interface GetProfileResponse {
  id: string
  name: string
  joinedAt: string
  avatarUrl?: string
  stats: ProfileStatsResponse
  highlights: ProfileHighlightsResponse
  purchases: ProfilePurchaseResponse[]
  sales: ProfileSaleResponse[]
}

export type GetProfilesResponse = GetProfileResponse[]
