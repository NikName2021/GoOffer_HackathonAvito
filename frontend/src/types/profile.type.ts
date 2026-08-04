export interface Review {
  comment: string
  createdAt: string
  rating: number
}

export interface AdBase {
  title: string
  category: string
  subcategory?: string
  imageUrl?: string
  price: number
  viewCount: number
}

type SaleState =
  | {
      isSold: false
      soldAt?: never
      review?: never
    }
  | {
      isSold: true
      soldAt: string
      review?: Review
    }

type FavoriteState =
  | {
      isFavorite: false
      favoritedAt?: never
    }
  | {
      isFavorite: true
      favoritedAt: string
    }

type PurchaseState =
  | {
      isPurchased: false
      purchasedAt?: never
    }
  | {
      isPurchased: true
      purchasedAt: string
    }

export type OwnAd = AdBase &
  SaleState & {
    isArchived: boolean
  }

export type ViewedAd = AdBase &
  FavoriteState &
  PurchaseState & {
    lastViewedAt: string
  }

export type SoldOwnAd = OwnAd & {
  isSold: true
  soldAt: string
}

export type PurchasedViewedAd = ViewedAd & {
  isPurchased: true
  purchasedAt: string
}

export interface TestProfile {
  name: string
  joinedAt: string
  avatarUrl?: string
  likes: number
  chatsCount: number
  views: ViewedAd[]
  ownAds: OwnAd[]
}
