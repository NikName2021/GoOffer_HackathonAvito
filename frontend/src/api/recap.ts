import axios from 'axios'

import { apiClient } from './api'
import type { GenerateRecapRequest, RecapResponse, ShareRecapResponse } from '@/types/recap.type'

interface RecapErrorEnvelope {
  error?: {
    code?: string
    message?: string
  }
}

function throwRecapError(error: unknown): never {
  if (axios.isAxiosError<RecapErrorEnvelope>(error)) {
    const status = error.response?.status
    if (!error.response || (status && status >= 500)) {
      throw new Error('Не удалось связаться с сервером итогов.')
    }
    if (status === 401) throw new Error('Войдите в аккаунт, чтобы посмотреть итоги года.')
    if (status === 404) throw new Error('Профиль для этих итогов не найден.')
    throw new Error(error.response.data?.error?.message || 'Не удалось сформировать итоги года.')
  }

  if (error instanceof Error) throw error
  throw new Error('Не удалось сформировать итоги года.')
}

export async function generateRecap(request: GenerateRecapRequest): Promise<RecapResponse> {
  try {
    const { data } = await apiClient.post<RecapResponse>('/recap/generate', request)
    if (!data.summary || !Array.isArray(data.cards) || data.cards.length === 0) {
      throw new Error('Сервер вернул итоги без карточек. Перезапустите актуальную версию backend.')
    }
    return data
  } catch (error) {
    throwRecapError(error)
  }
}

export async function getShareRecap(userId: string, year: number): Promise<ShareRecapResponse> {
  try {
    const safeUserId = encodeURIComponent(userId)
    const { data } = await apiClient.get<ShareRecapResponse>(`/recap/${safeUserId}/${year}/share`)
    return data
  } catch (error) {
    throwRecapError(error)
  }
}
