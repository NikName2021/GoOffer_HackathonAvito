import { API_BASE_URL } from './api'
import type { RecapEventOptions, RecapEventRequest } from '@/types/recapEvent.type'

export async function sendRecapEvent(event: RecapEventRequest, options: RecapEventOptions = {}): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/recap/events`, {
      body: JSON.stringify(event),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      keepalive: options.keepalive ?? false,
      method: 'POST',
    })

    return response.ok
  } catch {
    return false
  }
}
