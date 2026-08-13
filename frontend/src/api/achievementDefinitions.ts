import axios from 'axios'

import { apiClient } from './api'
import type {
  AchievementDefinition,
  AchievementDefinitionOptions,
  AchievementDefinitionRequest,
} from '@/types/achievementDefinition.type'

interface AdminErrorEnvelope {
  error?: { message?: string }
}

function throwAchievementError(error: unknown): never {
  if (axios.isAxiosError<AdminErrorEnvelope>(error)) {
    if (!error.response || error.response.status >= 500) throw new Error('Не удалось связаться с сервером ачивок.')
    if (error.response.status === 401) throw new Error('Войдите в аккаунт администратора.')
    if (error.response.status === 403) throw new Error('Настройки доступны только администраторам.')
    if (error.response.status === 404) throw new Error('Ачивка не найдена.')
    throw new Error(error.response.data?.error?.message || 'Не удалось сохранить ачивку.')
  }
  if (error instanceof Error) throw error
  throw new Error('Не удалось выполнить запрос к ачивкам.')
}

export async function getAchievementDefinitions() {
  try {
    const { data } = await apiClient.get<{ items: AchievementDefinition[] }>('/admin/achievement-definitions')
    return data.items
  } catch (error) {
    throwAchievementError(error)
  }
}

export async function getAchievementDefinitionOptions() {
  try {
    const { data } = await apiClient.get<AchievementDefinitionOptions>('/admin/achievement-definitions/options')
    return data
  } catch (error) {
    throwAchievementError(error)
  }
}

export async function updateAchievementDefinition(slug: string, definition: AchievementDefinitionRequest) {
  try {
    const { data } = await apiClient.put<AchievementDefinition>(
      `/admin/achievement-definitions/${encodeURIComponent(slug)}`,
      definition,
    )
    return data
  } catch (error) {
    throwAchievementError(error)
  }
}
