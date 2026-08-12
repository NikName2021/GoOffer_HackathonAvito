import { describe, expect, it } from '@jest/globals'

import type { RecapCardResponse } from '@/types/recap.type'
import { getInitialShareCardIds, getShareableRecapCards, toggleShareCardId } from '@/utils/recapShareSelection'

function card(id: string, shareable = true): RecapCardResponse {
  return {
    description: `Описание ${id}`,
    id,
    kind: 'overview',
    presentation: { icon: 'sparkles', layout: 'hero', theme: 'avito-blue' },
    reason: 'Тест',
    shareable,
    title: `Карточка ${id}`,
  }
}

describe('recap public share selection', () => {
  it('shows and preselects only shareable cards', () => {
    const cards = [card('year_overview'), card('private', false), card('category_mix')]
    expect(getShareableRecapCards(cards).map(({ id }) => id)).toEqual(['year_overview', 'category_mix'])
    expect(getInitialShareCardIds(cards)).toEqual(['year_overview', 'category_mix'])
  })

  it('limits initial and manual selection to nine unique card ids', () => {
    const cards = Array.from({ length: 11 }, (_, index) => card(`card-${index}`))
    const selected = getInitialShareCardIds(cards)
    expect(selected).toHaveLength(9)
    expect(toggleShareCardId(selected, 'card-10')).toEqual(selected)
  })

  it('removes and adds a selected card id', () => {
    expect(toggleShareCardId(['year_overview', 'category_mix'], 'year_overview')).toEqual(['category_mix'])
    expect(toggleShareCardId(['category_mix'], 'year_overview')).toEqual(['category_mix', 'year_overview'])
  })
})
