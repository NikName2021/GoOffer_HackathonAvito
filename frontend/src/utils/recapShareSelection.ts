import type { RecapCardResponse } from '@/types/recap.type'

const MAX_SHARE_CARDS = 9

export function getShareableRecapCards(cards: RecapCardResponse[]) {
  return cards.filter((card) => card.shareable)
}

export function getInitialShareCardIds(cards: RecapCardResponse[]) {
  return getShareableRecapCards(cards).slice(0, MAX_SHARE_CARDS).map((card) => card.id)
}

export function toggleShareCardId(selectedIds: string[], id: string) {
  if (selectedIds.includes(id)) return selectedIds.filter((selectedId) => selectedId !== id)
  return selectedIds.length >= MAX_SHARE_CARDS ? selectedIds : [...selectedIds, id]
}
