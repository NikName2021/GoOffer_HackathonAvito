import { describe, expect, it } from '@jest/globals'

import type { RecapCardCTA } from '@/types/recap.type'
import { getRecapCtaUrl } from '@/utils/recapCta'

const profileId = 'profile 1'

function url(action: string, params?: Record<string, string>) {
  return getRecapCtaUrl({ action, label: 'Открыть', params } as RecapCardCTA, profileId)
}

describe('getRecapCtaUrl', () => {
  it.each([
    ['open_favorites', '/avito/favorites?profileId=profile+1'],
    ['open_chats', '/avito/messages?profileId=profile+1'],
    ['create_listing', '/avito/create?profileId=profile+1'],
    ['open_recommendations', '/avito/recommendations?profileId=profile+1'],
    ['open_own_listings', '/avito/my/items?profileId=profile+1'],
    ['open_delivery_items', '/avito/delivery?profileId=profile+1'],
  ])('maps %s to a local mocked page', (action, expected) => {
    expect(url(action)).toBe(expected)
  })

  it('passes category and listing identifiers to local pages', () => {
    expect(url('open_category', { category: 'Электроника' })).toBe('/avito/search?category=%D0%AD%D0%BB%D0%B5%D0%BA%D1%82%D1%80%D0%BE%D0%BD%D0%B8%D0%BA%D0%B0&profileId=profile+1')
    expect(url('open_listing', { ad_id: 'ad/42' })).toBe('/avito/items/ad%2F42?profileId=profile+1')
  })
})
