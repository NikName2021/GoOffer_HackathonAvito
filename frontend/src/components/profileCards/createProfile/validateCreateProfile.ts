import type { CreateProfileRequest } from '@/types/profileRequest.type'

export type CreateProfileSection = 'profile' | 'ads' | 'views'

export interface CreateProfileValidationError {
  message: string
  section: CreateProfileSection
}

function getActivityName(title: string, index: number) {
  const name = title.trim()
  return name ? `«${name}»` : `№${index + 1}`
}

export function validateCreateProfile(profile: CreateProfileRequest): CreateProfileValidationError | null {
  if (!profile.name.trim() || !profile.joinedAt) {
    return { message: 'Заполните имя и дату регистрации профиля.', section: 'profile' }
  }

  if (profile.ownAds.length > 10_000 || profile.views.length > 10_000) {
    return { message: 'В каждом списке может быть не более 10 000 элементов.', section: 'ads' }
  }

  const invalidAdIndex = profile.ownAds.findIndex((ad) => !ad.adId.trim() || !ad.title.trim() || !ad.category.trim())
  if (invalidAdIndex !== -1) {
    const ad = profile.ownAds[invalidAdIndex]
    const fields = [
      !ad.adId.trim() && 'ID',
      !ad.title.trim() && 'название',
      !ad.category.trim() && 'категорию',
    ].filter(Boolean).join(', ')
    return { message: `Заполните ${fields} объявления ${getActivityName(ad.title, invalidAdIndex)}.`, section: 'ads' }
  }

  const missingPublishedAtIndex = profile.ownAds.findIndex((ad) => !ad.publishedAt)
  if (missingPublishedAtIndex !== -1) {
    const ad = profile.ownAds[missingPublishedAtIndex]
    return { message: `Укажите дату публикации объявления ${getActivityName(ad.title, missingPublishedAtIndex)}.`, section: 'ads' }
  }

  const invalidSaleIndex = profile.ownAds.findIndex(
    (ad) => ad.isSold && (
      !ad.soldAt || ad.soldAt < ad.publishedAt ||
      (ad.review && (!ad.review.comment.trim() || !ad.review.createdAt || ad.review.rating < 1 || ad.review.rating > 5))
    ),
  )
  if (invalidSaleIndex !== -1) {
    const ad = profile.ownAds[invalidSaleIndex]
    return { message: `Проверьте данные продажи объявления ${getActivityName(ad.title, invalidSaleIndex)}.`, section: 'ads' }
  }

  const invalidViewIndex = profile.views.findIndex(
    (view) =>
      !view.adId.trim() ||
      !view.title.trim() ||
      !view.category.trim() ||
      view.viewedAt.length === 0 ||
      !view.viewedAt.some((event) => event.type === 'watch') ||
      view.viewedAt.some((event) => !event.time) ||
      view.viewedAt.filter((event) => event.type === 'like').length > 1 ||
      view.viewedAt.filter((event) => event.type === 'buy').length > 1,
  )
  if (invalidViewIndex !== -1) {
    const view = profile.views[invalidViewIndex]
    return { message: `Проверьте события объявления ${getActivityName(view.title, invalidViewIndex)}. Нужен хотя бы один просмотр с датой.`, section: 'views' }
  }

  const ids = [...profile.ownAds.map((ad) => ad.adId), ...profile.views.map((view) => view.adId)]
  if (new Set(ids).size !== ids.length) {
    return { message: 'ID объявлений должны быть уникальными во всём профиле.', section: 'ads' }
  }

  return null
}
