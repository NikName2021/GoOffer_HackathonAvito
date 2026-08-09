import type {
  CardAnalysis,
  CardCondition,
  CardDefinitionKind,
  CardLayout,
  CardMetric,
} from '@/types/cardDefinition.type'

export const cardKindLabels: Record<CardDefinitionKind, string> = {
  statistic: 'Статистика',
  highlight: 'Главный момент',
}

export const cardMetricLabels: Record<CardMetric, string> = {
  total_views: 'Просмотры',
  favorites: 'Избранное',
  purchases: 'Покупки',
  sales: 'Продажи',
  listing_views: 'Просмотры объявлений',
  contacts: 'Открытия контактов',
  reviews: 'Отзывы',
  activity_days: 'Активные дни',
  categories: 'Категории',
  deals: 'Все сделки',
}

export const cardAnalysisLabels: Record<CardAnalysis, string> = {
  total: 'Сумма за год',
  monthly_average: 'Среднее за месяц',
  monthly_max: 'Лучший месяц',
}

export const cardConditionLabels: Record<CardCondition, string> = {
  always: 'Показывать всегда',
  gt: 'Больше',
  gte: 'Не меньше',
  lt: 'Меньше',
  lte: 'Не больше',
  eq: 'Равно',
}

export const cardLayoutLabels: Record<CardLayout, string> = {
  statistic: 'Компактная карточка',
  hero: 'Большая карточка',
}

export const cardThemes = [
  { label: 'Синий', value: 'avito-blue', color: '#00aaff' },
  { label: 'Зелёный', value: 'avito-green', color: '#00b956' },
  { label: 'Фиолетовый', value: 'avito-purple', color: '#965eeb' },
  { label: 'Красный', value: 'avito-red', color: '#ff4053' },
  { label: 'Оранжевый', value: 'avito-orange', color: '#ff9f1a' },
] as const

export const cardIcons = [
  { label: 'График', value: 'chart' },
  { label: 'Искры', value: 'sparkles' },
  { label: 'Глаз', value: 'eye' },
  { label: 'Сердце', value: 'heart' },
  { label: 'Покупки', value: 'bag' },
  { label: 'Звезда', value: 'star' },
  { label: 'Календарь', value: 'calendar' },
  { label: 'Категории', value: 'categories' },
  { label: 'Достижение', value: 'trophy' },
] as const
