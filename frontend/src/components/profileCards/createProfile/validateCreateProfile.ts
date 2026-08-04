import type { CreateProfileRequest } from '@/types/profileRequest.type'

export type CreateProfileSection = 'profile' | 'ads' | 'views'

export interface CreateProfileValidationError {
  message: string
  section: CreateProfileSection
}

export function validateCreateProfile(profile: CreateProfileRequest): CreateProfileValidationError | null {
  if (!profile.name.trim() || !profile.joinedAt) {
    return { message: 'Заполните имя и дату регистрации профиля.', section: 'profile' }
  }

  const invalidAdIndex = profile.ownAds.findIndex((ad) => !ad.title.trim() || !ad.category.trim())
  if (invalidAdIndex !== -1) {
    return { message: `Заполните название и категорию объявления ${invalidAdIndex + 1}.`, section: 'ads' }
  }

  const invalidSaleIndex = profile.ownAds.findIndex(
    (ad) => ad.isSold && (!ad.soldAt || (ad.review && (!ad.review.comment.trim() || !ad.review.createdAt))),
  )
  if (invalidSaleIndex !== -1) {
    return { message: `Заполните данные продажи объявления ${invalidSaleIndex + 1}.`, section: 'ads' }
  }

  const invalidViewIndex = profile.views.findIndex(
    (view) =>
      !view.title.trim() ||
      !view.category.trim() ||
      !view.lastViewedAt ||
      (view.isFavorite && !view.favoritedAt) ||
      (view.isPurchased && !view.purchasedAt),
  )
  if (invalidViewIndex !== -1) {
    return { message: `Заполните обязательные поля просмотра ${invalidViewIndex + 1}.`, section: 'views' }
  }

  return null
}
