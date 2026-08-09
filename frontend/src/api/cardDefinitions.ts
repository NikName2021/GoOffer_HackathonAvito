import axios from 'axios'

import { apiClient } from './api'
import type { CardDefinition, CardDefinitionOptions, CardDefinitionRequest } from '@/types/cardDefinition.type'

interface AdminErrorEnvelope {
  error?: { message?: string }
}

function throwCardDefinitionError(error: unknown): never {
  if (axios.isAxiosError<AdminErrorEnvelope>(error)) {
    if (!error.response || error.response.status >= 500) {
      throw new Error('Не удалось связаться с сервером настроек.')
    }
    if (error.response.status === 401) throw new Error('Войдите в аккаунт администратора.')
    if (error.response.status === 403) throw new Error('Настройки доступны только администраторам.')
    if (error.response.status === 404) throw new Error('Настройка или выбранный профиль не найдены.')
    throw new Error(error.response.data?.error?.message || 'Не удалось сохранить настройку.')
  }
  if (error instanceof Error) throw error
  throw new Error('Не удалось выполнить запрос настроек.')
}

export async function getCardDefinitionOptions() {
  try {
    const { data } = await apiClient.get<CardDefinitionOptions>('/admin/card-definitions/options')
    return data
  } catch (error) {
    throwCardDefinitionError(error)
  }
}

export async function getCardDefinitions() {
  try {
    const { data } = await apiClient.get<{ items: CardDefinition[] }>('/admin/card-definitions')
    return data.items
  } catch (error) {
    throwCardDefinitionError(error)
  }
}

export async function createCardDefinition(definition: CardDefinitionRequest) {
  try {
    const { data } = await apiClient.post<CardDefinition>('/admin/card-definitions', definition)
    return data
  } catch (error) {
    throwCardDefinitionError(error)
  }
}

export async function updateCardDefinition(id: string, definition: CardDefinitionRequest) {
  try {
    const { data } = await apiClient.put<CardDefinition>(
      `/admin/card-definitions/${encodeURIComponent(id)}`,
      definition,
    )
    return data
  } catch (error) {
    throwCardDefinitionError(error)
  }
}

export async function deleteCardDefinition(id: string) {
  try {
    await apiClient.delete(`/admin/card-definitions/${encodeURIComponent(id)}`)
  } catch (error) {
    throwCardDefinitionError(error)
  }
}
