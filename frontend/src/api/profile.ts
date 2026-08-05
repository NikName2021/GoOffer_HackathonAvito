import axios from 'axios'

import { apiClient } from './api'
import type { CreateProfileRequest } from '@/types/profileRequest.type'
import type { GetProfileResponse, GetProfilesResponse } from '@/types/profileResponse.type'

interface ProfileErrorEnvelope {
  error?: {
    code?: string
    message?: string
  }
}

function throwProfileError(error: unknown, fallbackMessage: string): never {
  if (axios.isAxiosError<ProfileErrorEnvelope>(error)) {
    const status = error.response?.status

    if (!error.response || (status && status >= 500)) {
      throw new Error('Не удалось связаться с сервером.')
    }
    if (status === 401) {
      throw new Error('Войдите в аккаунт, чтобы работать с профилями.')
    }

    throw new Error(error.response.data?.error?.message || fallbackMessage)
  }

  if (error instanceof Error) throw error
  throw new Error(fallbackMessage)
}

export async function getProfiles(): Promise<GetProfilesResponse> {
  try {
    const { data } = await apiClient.get<GetProfilesResponse>('/profiles')
    return data
  } catch (error) {
    throwProfileError(error, 'Не удалось загрузить профили.')
  }
}

export async function createProfile(profile: CreateProfileRequest): Promise<GetProfileResponse> {
  try {
    const { data } = await apiClient.post<GetProfileResponse>('/profiles', profile)
    return data
  } catch (error) {
    throwProfileError(error, 'Не удалось создать профиль.')
  }
}
