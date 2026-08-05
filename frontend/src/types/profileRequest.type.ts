interface CreateAdRequestBase {
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

type SaleRequestState =
  | {
      isSold: false
      soldAt?: never
      review?: never
    }
  | {
      isSold: true
      soldAt: string
      review?: CreateReviewRequest
    }

type FavoriteRequestState =
  | {
      isFavorite: false
      favoritedAt?: never
    }
  | {
      isFavorite: true
      favoritedAt: string
    }

type PurchaseRequestState =
  | {
      isPurchased: false
      purchasedAt?: never
    }
  | {
      isPurchased: true
      purchasedAt: string
    }

export type CreateOwnAdRequest = CreateAdRequestBase &
  SaleRequestState & {
    isArchived: boolean
  }

export type CreateViewedAdRequest = CreateAdRequestBase &
  FavoriteRequestState &
  PurchaseRequestState & {
    lastViewedAt: string
  }

/** Тело POST-запроса создания тестового профиля. */
export interface CreateProfileRequest {
  name: string
  joinedAt: string
  avatarUrl?: string
  likes: number
  chatsCount: number
  views: CreateViewedAdRequest[]
  ownAds: CreateOwnAdRequest[]
}

/** Тело PUT-запроса: все редактируемые исходные данные профиля. */
export type UpdateProfileRequest = CreateProfileRequest
