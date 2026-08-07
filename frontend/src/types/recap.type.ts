export interface CategoryStat {
  category: string
  count: number
}

export interface Achievement {
  slug: string
  title: string
  description: string
  icon: string
  category: string
}

export interface Recommendation {
  code: string
  title: string
  description: string
  action_label: string
  category?: string
}

export interface Story {
  persona: string
  headline: string
  summary: string
  insights: string[]
  highlights?: string[]
}

export interface Recap {
  id: string
  user_id: string
  year: number
  total_views: number
  total_messages: number
  total_favorites: number
  total_purchases: number
  total_sales: number
  activity_days: number
  top_categories: CategoryStat[]
  achievements: Achievement[]
  recommendations: Recommendation[]
  story?: Story
  generated_at: string
}

export type ShareRecap = Omit<Recap, 'id' | 'user_id'>

export interface ApiProfile {
  id: string
  name: string
  avatar?: string
  profile_type?: string
  registered_at?: string
}