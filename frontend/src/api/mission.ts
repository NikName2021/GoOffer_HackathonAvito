import axios from 'axios'

import { apiClient } from './api'
import type { MissionCode, MissionOverview } from '@/types/mission.type'

interface MissionErrorEnvelope {
  error?: { message?: string }
}

function throwMissionError(error: unknown): never {
  if (axios.isAxiosError<MissionErrorEnvelope>(error)) {
    const status = error.response?.status
    if (!error.response || (status && status >= 500)) {
      throw new Error('Не удалось связаться с сервером миссий.')
    }
    if (status === 401) throw new Error('Войдите в аккаунт, чтобы выбрать миссию.')
    if (status === 404) throw new Error('Миссии для этих итогов пока недоступны.')
    throw new Error(error.response.data?.error?.message || 'Не удалось загрузить миссию.')
  }

  if (error instanceof Error) throw error
  throw new Error('Не удалось загрузить миссию.')
}

function missionUrl(userId: string, year: number) {
  return `/recap/${encodeURIComponent(userId)}/${year}/mission`
}

export async function getMission(userId: string, year: number): Promise<MissionOverview> {
  try {
    const { data } = await apiClient.get<MissionOverview>(missionUrl(userId, year))
    return data
  } catch (error) {
    throwMissionError(error)
  }
}

export async function selectMission(userId: string, year: number, code: MissionCode): Promise<MissionOverview> {
  try {
    const { data } = await apiClient.put<MissionOverview>(missionUrl(userId, year), { code })
    return data
  } catch (error) {
    throwMissionError(error)
  }
}
