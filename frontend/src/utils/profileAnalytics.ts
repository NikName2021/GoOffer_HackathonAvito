import type { OwnAd, PurchasedViewedAd, SoldOwnAd, ViewedAd } from '@/types/profile.type'

export function getPurchasedAds(views: ViewedAd[]): PurchasedViewedAd[] {
  return views.filter((view): view is PurchasedViewedAd => view.isPurchased)
}

export function getSoldAds(ownAds: OwnAd[]): SoldOwnAd[] {
  return ownAds.filter((ad): ad is SoldOwnAd => ad.isSold)
}

export function getTotalViewCount(views: ViewedAd[]) {
  return views.reduce((total, view) => total + view.viewCount, 0)
}
