import type { RecapCardResponse, RecapResponse } from '@/types/recap.type'

const reasons: Record<string, string> = {
  year_overview: 'Мы собрали в одной истории активность покупателя и продавца.',
  main_interest: 'Эта категория чаще других встречалась в вашей активности.',
  viewed_findings: 'В выбранном году вы возвращались к этим объявлениям и изучали их.',
  avito_delivery: 'В истории есть подтверждённые покупки через Авито Доставку.',
  favorites: 'В выбранном году вы сохраняли объявления в избранное.',
  largest_purchase: 'Это самая дорогая из подтверждённых покупок выбранного года.',
  chats: 'В профиле есть диалоги с продавцами и покупателями.',
  purchases: 'За выбранный год у вас было несколько подтверждённых покупок.',
  seller_portfolio: 'В профиле есть созданные вами объявления.',
  star_listing: 'Это объявление получило больше всего просмотров.',
  second_life: 'В выбранном году ваши объявления завершились продажей.',
  listing_views: 'Пользователи просматривали ваши объявления.',
  seller_favorites: 'Ваши объявления добавляли в избранное.',
  seller_likes_legacy: 'Пользователи отмечали, что им нравятся ваши объявления.',
  seller_contacts: 'Покупатели открывали контакты в ваших объявлениях.',
  reviews: 'В выбранном году покупатели оставляли отзывы о сделках.',
  both_sides: 'В профиле есть и покупки, и собственные объявления.',
  interest_circle: 'Ваша активность охватила несколько категорий.',
  avito_history: 'Дата регистрации профиля входит в период вашей истории на Авито.',
  next_step: 'Мы выбрали действие, которое логично продолжает вашу историю.',
}

export function getRecapReason(card: RecapCardResponse) {
  return reasons[card.id] ?? 'Карточка построена на данных активности этого профиля.'
}

export function getRecapDescription(card: RecapCardResponse, recap: RecapResponse) {
  const { buyer, seller } = recap.summary

  switch (card.id) {
    case 'avito_delivery':
      return `Авито Доставка помогла провести безопасно ${buyer.avito_delivery_purchases} покупок.`
    case 'largest_purchase':
      return `Самая крупная подтверждённая покупка ${recap.year} года.`
    case 'chats':
      return 'Общее количество диалогов профиля без содержимого сообщений и имён собеседников.'
    case 'seller_portfolio':
      return `Сейчас активно ${seller.active_listings}, в архиве — ${seller.archived_listings}.`
    case 'listing_views':
      return `Ваши объявления собрали ${seller.listing_views} просмотров.`
    case 'seller_favorites':
      return `Ваши объявления добавили в избранное ${seller.favorites_received} раз.`
    case 'seller_likes_legacy':
      return `Ваши объявления получили ${seller.likes_received} отметок.`
    case 'seller_contacts':
      return `Покупатели открыли контакты ${seller.contacts_received} раз.`
    case 'category_mix':
      return card.description.replace('значимых сигналов в профиле', 'вашей активности на Авито')
    default:
      return card.description
  }
}

export function isAllTimeRecapCard(card: RecapCardResponse) {
  return card.id === 'chats' || card.id === 'seller_likes_legacy'
}
