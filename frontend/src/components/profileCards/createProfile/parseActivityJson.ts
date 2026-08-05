import type { CreateOwnAdRequest, CreateViewedAdRequest } from '@/types/profileRequest.type'

type JsonRecord = Record<string, unknown>

function parseArray(text: string): unknown[] {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new Error('Файл содержит некорректный JSON.')
  }

  if (!Array.isArray(value)) throw new Error('В JSON должен находиться массив объектов.')
  if (value.length === 0) throw new Error('Массив не должен быть пустым.')
  return value
}

function getRecord(value: unknown, index: number): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Элемент ${index + 1} должен быть объектом.`)
  }
  return value as JsonRecord
}

function assertString(record: JsonRecord, field: string, index: number, optional = false) {
  const value = record[field]
  if (optional && value === undefined) return
  if (typeof value !== 'string' || (!optional && !value.trim())) {
    throw new Error(`Поле ${field} элемента ${index + 1} должно быть непустой строкой.`)
  }
}

function assertNumber(record: JsonRecord, field: string, index: number) {
  const value = record[field]
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`Поле ${field} элемента ${index + 1} должно быть неотрицательным числом.`)
  }
}

function assertBoolean(record: JsonRecord, field: string, index: number) {
  if (typeof record[field] !== 'boolean') throw new Error(`Поле ${field} элемента ${index + 1} должно быть boolean.`)
}

function validateBase(record: JsonRecord, index: number) {
  assertString(record, 'title', index)
  assertString(record, 'category', index)
  assertString(record, 'subcategory', index, true)
  assertString(record, 'imageUrl', index, true)
  assertNumber(record, 'price', index)
  assertNumber(record, 'viewCount', index)
}

function validateReview(value: unknown, index: number) {
  const review = getRecord(value, index)
  assertString(review, 'comment', index)
  assertString(review, 'createdAt', index)
  assertNumber(review, 'rating', index)
  if ((review.rating as number) < 1 || (review.rating as number) > 5) {
    throw new Error(`Оценка отзыва элемента ${index + 1} должна быть от 1 до 5.`)
  }
}

export function parseOwnAdsJson(text: string): CreateOwnAdRequest[] {
  return parseArray(text).map((value, index) => {
    const record = getRecord(value, index)
    validateBase(record, index)
    assertBoolean(record, 'isArchived', index)
    assertBoolean(record, 'isSold', index)

    if (record.isSold) {
      assertString(record, 'soldAt', index)
      if (record.review !== undefined) validateReview(record.review, index)
    } else if (record.soldAt !== undefined || record.review !== undefined) {
      throw new Error(`У непроданного объявления ${index + 1} не должно быть soldAt или review.`)
    }
    return record as unknown as CreateOwnAdRequest
  })
}

export function parseViewedAdsJson(text: string): CreateViewedAdRequest[] {
  return parseArray(text).map((value, index) => {
    const record = getRecord(value, index)
    validateBase(record, index)
    assertString(record, 'lastViewedAt', index)
    assertBoolean(record, 'isFavorite', index)
    assertBoolean(record, 'isPurchased', index)

    if (record.isFavorite) assertString(record, 'favoritedAt', index)
    else if (record.favoritedAt !== undefined) throw new Error(`У просмотра ${index + 1} без избранного не должно быть favoritedAt.`)
    if (record.isPurchased) assertString(record, 'purchasedAt', index)
    else if (record.purchasedAt !== undefined) throw new Error(`У просмотра ${index + 1} без покупки не должно быть purchasedAt.`)

    return record as unknown as CreateViewedAdRequest
  })
}
