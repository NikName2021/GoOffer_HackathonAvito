import axios from 'axios'

import { API_BASE_URL, apiClient } from './api'
import type {
  CreateRecapShareRequest,
  GenerateRecapRequest,
  PublicRecapShare,
  RecapResponse,
  RecapShareCreated,
} from '@/types/recap.type'

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

export async function createRecapShare(
  userId: string,
  year: number,
  request: CreateRecapShareRequest,
): Promise<RecapShareCreated> {
  try {
    const safeUserId = encodeURIComponent(userId)
    const { data } = await apiClient.post<RecapShareCreated>(`/recap/${safeUserId}/${year}/shares`, request)
    return data
  } catch (error) {
    throwRecapError(error)
  }
}

export async function getPublicRecapShare(token: string): Promise<PublicRecapShare> {
  try {
    const { data } = await axios.get<PublicRecapShare>(
      `${API_BASE_URL}/public/recap-shares/${encodeURIComponent(token)}`,
      { withCredentials: false },
    )
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error('Ссылка недействительна или срок её действия истёк.', { cause: error })
    }
    if (axios.isAxiosError(error) && (!error.response || error.response.status >= 500)) {
      throw new Error('Не удалось загрузить публичные итоги. Попробуйте ещё раз.', { cause: error })
    }
    throw error instanceof Error ? error : new Error('Не удалось загрузить публичные итоги.', { cause: error })
  }
}
