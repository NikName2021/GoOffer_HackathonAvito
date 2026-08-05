import { parseOwnAdsJson, parseViewedAdsJson } from '../createProfile/parseActivityJson'
import type { CreateProfileRequest } from '@/types/profileRequest.type'

type JsonRecord = Record<string, unknown>

function getRecord(value: unknown, index: number): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Профиль ${index + 1} должен быть объектом.`)
  }
  return value as JsonRecord
}

function getString(record: JsonRecord, field: string, index: number, optional = false) {
  const value = record[field]
  if (optional && value === undefined) return undefined
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Поле ${field} профиля ${index + 1} должно быть непустой строкой.`)
  }
  return value.trim()
}

function getNumber(record: JsonRecord, field: string, index: number) {
  const value = record[field]
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`Поле ${field} профиля ${index + 1} должно быть целым неотрицательным числом.`)
  }
  return value
}

function getActivities<T>(record: JsonRecord, field: string, index: number, parse: (text: string) => T[]) {
  const value = record[field]
  if (!Array.isArray(value)) throw new Error(`Поле ${field} профиля ${index + 1} должно быть массивом.`)
  if (value.length === 0) return []
  try {
    return parse(JSON.stringify(value))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Некорректные данные.'
    throw new Error(`Профиль ${index + 1}, ${field}: ${message}`, { cause: error })
  }
}

export function parseProfilesJson(text: string): CreateProfileRequest[] {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new Error('Файл содержит некорректный JSON.')
  }
  if (!Array.isArray(value)) throw new Error('В JSON должен находиться массив профилей.')
  if (value.length === 0) throw new Error('Массив профилей не должен быть пустым.')

  return value.map((item, index) => {
    const profile = getRecord(item, index)
    return {
      name: getString(profile, 'name', index) ?? '',
      joinedAt: getString(profile, 'joinedAt', index) ?? '',
      avatarUrl: getString(profile, 'avatarUrl', index, true),
      likes: getNumber(profile, 'likes', index),
      chatsCount: getNumber(profile, 'chatsCount', index),
      views: getActivities(profile, 'views', index, parseViewedAdsJson),
      ownAds: getActivities(profile, 'ownAds', index, parseOwnAdsJson),
    }
  })
}
