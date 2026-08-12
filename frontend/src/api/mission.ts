import axios from 'axios'

import { apiClient } from './api'
import type { MissionCode, MissionOverview, ProfileMissionOverview } from '@/types/mission.type'

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

export async function selectMissions(userId: string, year: number, codes: MissionCode[]): Promise<MissionOverview> {
  try {
    const { data } = await apiClient.put<MissionOverview>(missionUrl(userId, year), { codes })
    return data
  } catch (error) {
    throwMissionError(error)
  }
}

export async function getProfileMissions(profileId: string): Promise<ProfileMissionOverview> {
  try {
    const { data } = await apiClient.get<ProfileMissionOverview>(
      `/profiles/${encodeURIComponent(profileId)}/missions`,
    )
    return data
  } catch (error) {
    throwMissionError(error)
  }
}
