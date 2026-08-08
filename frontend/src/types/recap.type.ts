export interface GenerateRecapRequest {
  user_id: string
  year: number
}

export interface RecapCategoryStat {
  category: string
  count: number
}

export interface RecapAchievement {
  slug: string
  title: string
  description: string
  icon: string
  category: string
}

export interface RecapItem {
  ad_id: string
  title: string
  category: string
  subcategory?: string
  image_url?: string
  price: number
}

export interface BuyerRecapSummary {
  has_data: boolean
  viewed_ads_count: number
  total_views: number
  favorites_count: number
  chats_count: number
  purchases_count: number
  avito_delivery_purchases: number
  main_category?: string
  largest_purchase?: RecapItem | null
}

export interface SellerRecapSummary {
  has_data: boolean
  listings_count: number
  active_listings: number
  archived_listings: number
  sales_count: number
  listing_views: number
  likes_received: number
  favorites_received: number
  contacts_received: number
  reviews_count: number
  average_rating?: number | null
  main_category?: string
  star_listing?: RecapItem | null
}

export interface CombinedRecapSummary {
  has_buyer_data: boolean
  has_seller_data: boolean
  categories_count: number
  deals_count: number
  main_category?: string
}

export interface RecapSummary {
  headline: string
  description: string
  buyer: BuyerRecapSummary
  seller: SellerRecapSummary
  combined: CombinedRecapSummary
}

export interface RecapCardPresentation {
  layout: string
  theme: string
  icon: string
}

export interface RecapCardCTA {
  label: string
  action: string
  params?: Record<string, string>
}

export interface RecapChartSeries {
  key: string
  label: string
  color: string
  values: number[]
}

export interface RecapChartSegment {
  key: string
  label: string
  color: string
  value: number
}

export interface RecapChartHighlight {
  index: number
  label: string
  value: number
}

export interface RecapVisualization {
  version: 1
  type: 'bar' | 'donut'
  unit?: string
  stacked?: boolean
  labels?: string[]
  series?: RecapChartSeries[]
  segments?: RecapChartSegment[]
  highlight?: RecapChartHighlight | null
}

export interface RecapCardResponse {
  id: string
  kind: 'overview' | 'interest' | 'buyer' | 'seller' | 'combined' | 'chart' | 'final'
  eyebrow?: string
  title: string
  description: string
  value?: string
  image_url?: string
  shareable: boolean
  reason: string
  presentation: RecapCardPresentation
  visualization?: RecapVisualization | null
  cta?: RecapCardCTA | null
}

export interface RecapResponse {
  id: string
  user_id: string
  year: number
  total_views: number
  total_messages: number
  total_favorites: number
  total_purchases: number
  total_sales: number
  top_categories: RecapCategoryStat[]
  achievements: RecapAchievement[]
  activity_days: number
  summary: RecapSummary
  cards: RecapCardResponse[]
  generated_at: string
}

export interface ShareRecapSummary {
  headline: string
  description: string
  combined: CombinedRecapSummary
}

export interface ShareRecapResponse extends Omit<RecapResponse, 'id' | 'user_id' | 'summary'> {
  summary: ShareRecapSummary
}
