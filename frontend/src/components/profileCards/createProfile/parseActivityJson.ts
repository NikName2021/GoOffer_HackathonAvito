import type { CreateOwnAdRequest, CreateViewedAdRequest } from '@/types/profileRequest.type'

type JsonRecord = Record<string, unknown>
const MAX_ACTIVITY_ITEMS = 10_000

function parseArray(text: string): unknown[] {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new Error('Файл содержит некорректный JSON.')
  }

  if (!Array.isArray(value)) throw new Error('В JSON должен находиться массив объектов.')
  if (value.length === 0) throw new Error('Массив не должен быть пустым.')
  if (value.length > MAX_ACTIVITY_ITEMS) throw new Error(`В массиве может быть не более ${MAX_ACTIVITY_ITEMS} объектов.`)
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
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`Поле ${field} элемента ${index + 1} должно быть целым неотрицательным числом.`)
  }
}

function assertBoolean(record: JsonRecord, field: string, index: number) {
  if (typeof record[field] !== 'boolean') throw new Error(`Поле ${field} элемента ${index + 1} должно быть boolean.`)
}

function validateBase(record: JsonRecord, index: number) {
  assertString(record, 'adId', index)
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
  const ads = parseArray(text).map((value, index) => {
    const record = getRecord(value, index)
    validateBase(record, index)
    assertString(record, 'publishedAt', index)
    assertNumber(record, 'favoritesCount', index)
    assertNumber(record, 'contactsCount', index)
    assertString(record, 'city', index, true)
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
  assertUniqueAdIds(ads)
  return ads
}

export function parseViewedAdsJson(text: string): CreateViewedAdRequest[] {
  const views = parseArray(text).map((value, index) => {
    const record = getRecord(value, index)
    validateBase(record, index)
    validateViewedEvents(record.viewedAt, index)

    return record as unknown as CreateViewedAdRequest
  })
  assertUniqueAdIds(views)
  return views
}

function validateViewedEvents(value: unknown, itemIndex: number) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Поле viewedAt элемента ${itemIndex + 1} должно содержать хотя бы одно событие.`)
  }
  if (value.length > MAX_ACTIVITY_ITEMS) {
    throw new Error(`В viewedAt элемента ${itemIndex + 1} может быть не более ${MAX_ACTIVITY_ITEMS} событий.`)
  }

  let watches = 0
  let likes = 0
  let buys = 0
  value.forEach((item, eventIndex) => {
    const event = getRecord(item, eventIndex)
    assertString(event, 'type', eventIndex)
    assertString(event, 'time', eventIndex)
    if (!['watch', 'like', 'buy'].includes(event.type as string)) {
      throw new Error(`Тип события ${eventIndex + 1} элемента ${itemIndex + 1} должен быть watch, like или buy.`)
    }
    if (event.type === 'watch') watches += 1
    if (event.type === 'like') likes += 1
    if (event.type === 'buy') buys += 1
    if (event.type === 'buy') assertBoolean(event, 'useAvitoDelivery', eventIndex)
    else if (event.useAvitoDelivery !== undefined) {
      throw new Error(`useAvitoDelivery разрешён только для события buy.`)
    }
  })
  if (watches === 0) throw new Error(`В viewedAt элемента ${itemIndex + 1} требуется хотя бы один watch.`)
  if (likes > 1 || buys > 1) throw new Error(`В viewedAt элемента ${itemIndex + 1} допустимо не более одного like и buy.`)
}

function assertUniqueAdIds(items: Array<{ adId: string }>) {
  const ids = new Set<string>()
  items.forEach((item, index) => {
    if (ids.has(item.adId)) throw new Error(`Поле adId элемента ${index + 1} должно быть уникальным.`)
    ids.add(item.adId)
  })
}
