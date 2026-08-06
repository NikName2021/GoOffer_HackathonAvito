import type { CreateOwnAdRequest, CreateViewedAdRequest } from './profileRequest.type'

interface ProfileActivityResponseBase {
  adId: string
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

export interface ViewedAdResponse extends CreateViewedAdRequest {
  lastViewedAt?: string
  isFavorite: boolean
  favoritedAt?: string
  isPurchased: boolean
  purchasedAt?: string
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

/** GET /profiles и GET /profiles/{id}: исходные данные плюс рассчитанные backend итоги. */
export interface GetProfileResponse {
  id: string
  name: string
  joinedAt: string
  avatarUrl?: string
  views: ViewedAdResponse[]
  ownAds: CreateOwnAdRequest[]
  stats: ProfileStatsResponse
  highlights: ProfileHighlightsResponse
  purchases: ProfilePurchaseResponse[]
  sales: ProfileSaleResponse[]
}

export type GetProfilesResponse = GetProfileResponse[]
export type GetProfileDetailsResponse = GetProfileResponse
