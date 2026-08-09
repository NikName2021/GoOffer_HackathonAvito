export type CardDefinitionKind = 'statistic' | 'highlight'
export type CardMetric =
  | 'total_views'
  | 'favorites'
  | 'purchases'
  | 'sales'
  | 'listing_views'
  | 'contacts'
  | 'reviews'
  | 'activity_days'
  | 'categories'
  | 'deals'
export type CardAnalysis = 'total' | 'monthly_average' | 'monthly_max'
export type CardCondition = 'always' | 'gt' | 'gte' | 'lt' | 'lte' | 'eq'
export type CardLayout = 'statistic' | 'hero'

export interface CardDefinitionRequest {
  name: string
  target_user_id?: string
  kind: CardDefinitionKind
  metric: CardMetric
  analysis: CardAnalysis
  condition_operator: CardCondition
  condition_value?: number
  title: string
  description: string
  value_suffix: string
  layout: CardLayout
  theme: string
  icon: string
  shareable: boolean
  sort_order: number
  is_active: boolean
}

export interface CardDefinition extends CardDefinitionRequest {
  id: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface CardDefinitionOptions {
  kinds: CardDefinitionKind[]
  metrics: CardMetric[]
  analyses: CardAnalysis[]
  conditions: CardCondition[]
  layouts: CardLayout[]
  monthly_metrics: CardMetric[]
}
