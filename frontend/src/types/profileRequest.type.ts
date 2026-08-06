interface CreateAdRequestBase {
  adId: string
  title: string
  category: string
  subcategory?: string
  imageUrl?: string
  price: number
  viewCount: number
}

export interface CreateReviewRequest {
  comment: string
  rating: number
  createdAt: string
}

export type ViewedAdEventType = 'watch' | 'like' | 'buy'

export type CreateViewedAdEventRequest =
  | { type: 'watch' | 'like'; time: string; useAvitoDelivery?: never }
  | { type: 'buy'; time: string; useAvitoDelivery: boolean }

type SaleRequestState =
  | { isSold: false; soldAt?: never; review?: never }
  | { isSold: true; soldAt: string; review?: CreateReviewRequest }

export type CreateOwnAdRequest = CreateAdRequestBase &
  SaleRequestState & {
    publishedAt: string
    favoritesCount: number
    contactsCount: number
    city?: string
    isArchived: boolean
  }

export interface CreateViewedAdRequest extends CreateAdRequestBase {
  viewedAt: CreateViewedAdEventRequest[]
}

/** Тело POST /profiles. Производные признаки покупки и избранного backend рассчитывает из viewedAt. */
export interface CreateProfileRequest {
  name: string
  joinedAt: string
  avatarUrl?: string
  likes: number
  chatsCount: number
  views: CreateViewedAdRequest[]
  ownAds: CreateOwnAdRequest[]
}

/** PUT принимает тот же полный набор исходных данных, что и POST. */
export type UpdateProfileRequest = CreateProfileRequest
