import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from '@jest/globals'

import { parseOwnAdsJson, parseViewedAdsJson } from '@/components/profileCards/createProfile/parseActivityJson'

function fixture(name: string) {
  return readFileSync(resolve(process.cwd(), 'public', 'test-data', name), 'utf8')
}

describe('downloadable activity fixtures', () => {
  it('contains 100 valid own ads', () => {
    expect(parseOwnAdsJson(fixture('own-ads-100.json'))).toHaveLength(100)
  })

  it('contains 100 viewed ads, including purchases represented by buy events', () => {
    const views = parseViewedAdsJson(fixture('viewed-ads-100.json'))

    expect(views).toHaveLength(100)
    expect(views.some((item) => item.viewedAt.some((event) => event.type === 'buy'))).toBe(true)
    expect(views.some((item) => item.viewedAt.every((event) => event.type !== 'buy'))).toBe(true)
  })
})
