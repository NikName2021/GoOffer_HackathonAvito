import type { ShareRecapCardResponse } from '@/types/recap.type'

export function getAllShareCardIndexes(cards: ShareRecapCardResponse[]) {
  return cards.map((_, index) => index)
}

export function getSelectedShareCards(cards: ShareRecapCardResponse[], selectedIndexes: number[]) {
  const selected = new Set(selectedIndexes)
  return cards.filter((_, index) => selected.has(index))
}

export function toggleShareCardIndex(selectedIndexes: number[], index: number) {
  return selectedIndexes.includes(index)
    ? selectedIndexes.filter((selectedIndex) => selectedIndex !== index)
    : [...selectedIndexes, index]
}
