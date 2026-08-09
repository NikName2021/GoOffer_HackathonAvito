import { describe, expect, it } from '@jest/globals'

import type { ShareRecapCardResponse } from '@/types/recap.type'
import { getAllShareCardIndexes, getSelectedShareCards, toggleShareCardIndex } from '@/utils/recapShareSelection'

const cards: ShareRecapCardResponse[] = [
  {
    description: 'Описание первой карточки',
    eyebrow: 'Итоги года',
    kind: 'overview',
    presentation: { icon: 'sparkles', layout: 'hero', theme: 'avito-blue' },
    title: 'Первая карточка',
    value: '2026',
  },
  {
    description: 'Описание второй карточки',
    eyebrow: 'Категория',
    kind: 'interest',
    presentation: { icon: 'heart', layout: 'stat', theme: 'avito-purple' },
    title: 'Вторая карточка',
    value: '30%',
  },
]

describe('share card selection without backend identifiers', () => {
  it('selects every card by its response position', () => {
    expect(getAllShareCardIndexes(cards)).toEqual([0, 1])
  })

  it('toggles one card without affecting cards with similar public fields', () => {
    expect(toggleShareCardIndex([0, 1], 0)).toEqual([1])
    expect(toggleShareCardIndex([1], 0)).toEqual([1, 0])
  })

  it('returns cards in backend order', () => {
    expect(getSelectedShareCards(cards, [1])).toEqual([cards[1]])
  })
})
