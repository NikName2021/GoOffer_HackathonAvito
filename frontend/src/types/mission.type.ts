import type { RecapCardCTA } from './recap.type'

export type MissionCode = 'sell_three_items' | 'buy_from_favorites' | 'try_avito_delivery'
export type MissionStatus = 'active' | 'completed'

export interface MissionOption {
  code: MissionCode
  title: string
  description: string
  target: number
  icon: string
  theme: string
  cta: RecapCardCTA
}

export interface MissionState extends MissionOption {
  recap_year: number
  progress: number
  progress_percent: number
  status: MissionStatus
  selected_at: string
  updated_at: string
  completed_at?: string
}

export interface MissionOverview {
  options: MissionOption[]
  selected_missions: MissionState[]
  /** @deprecated Используйте selected_missions. */
  selected: MissionState | null
}

export interface SelectMissionRequest {
  codes: MissionCode[]
}

export interface ProfileMissionOverview {
  missions: MissionState[]
}
