export type RecapEventName = 'recap_opened' | 'gift_opened' | 'slide_viewed' | 'recap_completed' | 'share_created' | 'cta_clicked'

export type RecapEventRequest = { event: Exclude<RecapEventName, 'slide_viewed'> } | { event: 'slide_viewed'; cta_visible: boolean }

export interface RecapEventOptions {
  keepalive?: boolean
}
