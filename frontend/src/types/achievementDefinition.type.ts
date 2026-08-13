import type { CardCondition, CardMetric } from './cardDefinition.type'

export type AchievementMetric = CardMetric
export type AchievementCondition = CardCondition

export interface AchievementDefinition {
  slug: string
  title: string
  description: string
  icon: string
  category: string
  metric: AchievementMetric
  condition_operator: AchievementCondition
  condition_value: number | null
  sort_order: number
  is_active: boolean
  updated_at: string
}

export interface AchievementDefinitionRequest {
  title: string
  description: string
  icon: string
  metric: AchievementMetric
  condition_operator: AchievementCondition
  condition_value: number | null
  is_active: boolean
}

export interface AchievementDefinitionOptions {
  metrics: AchievementMetric[]
  conditions: AchievementCondition[]
}
