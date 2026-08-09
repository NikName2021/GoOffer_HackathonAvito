import { apiClient } from './api'
import type { ApiProfile, Recap, ShareRecap } from '@/types/recap.type'

export async function fetchProfiles(): Promise<ApiProfile[]> {
  const { data } = await apiClient.get<ApiProfile[]>('/profiles')
  return data
}

export async function generateRecap(userId: string, year: number): Promise<Recap> {
  const { data } = await apiClient.post<Recap>('/recap/generate', {
    user_id: userId,
    year,
  })
  return data
}

export async function fetchRecap(userId: string, year: number): Promise<Recap> {
  const { data } = await apiClient.get<Recap>(`/recap/${userId}/${year}`)
  return data
}

export async function fetchShareRecap(userId: string, year: number): Promise<ShareRecap> {
  const { data } = await apiClient.get<ShareRecap>(`/recap/${userId}/${year}/share`)
  return data
}

export async function generateAllRecaps(year: number) {
  const { data } = await apiClient.post(`/recap/generate-all`, null, {
    params: { year },
  })
  return data as {
    year: number
    total: number
    success: number
    results: { user_id: string; ok: boolean; error?: string }[]
  }
}

export type CreateProfilePayload = {
  name: string
  profile_type: string
  avatar?: string
  year?: number
}

export async function createProfile(payload: CreateProfilePayload): Promise<ApiProfile> {
  const { data } = await apiClient.post<ApiProfile>('/profiles', payload)
  return data
}

export async function deleteProfile(id: string): Promise<void> {
  await apiClient.delete(`/profiles/${id}`)
}