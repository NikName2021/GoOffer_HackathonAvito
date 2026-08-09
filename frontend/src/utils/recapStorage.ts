const RECAP_OPENED_PREFIX = 'avito-recap-opened'

function getRecapOpenedKey(profileId: string, year: number) {
  return `${RECAP_OPENED_PREFIX}:${profileId}:${year}`
}

export function wasRecapOpened(profileId: string, year: number) {
  try {
    return window.localStorage.getItem(getRecapOpenedKey(profileId, year)) === 'true'
  } catch {
    return false
  }
}

export function markRecapOpened(profileId: string, year: number) {
  try {
    window.localStorage.setItem(getRecapOpenedKey(profileId, year), 'true')
  } catch {
    // Итоги продолжают работать, даже если localStorage недоступен.
  }
}

export function resetRecapOpened(profileId: string, year: number) {
  try {
    window.localStorage.removeItem(getRecapOpenedKey(profileId, year))
  } catch {
    // Новая симуляция всё равно откроется, если localStorage недоступен.
  }
}
