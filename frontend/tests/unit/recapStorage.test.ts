import { beforeEach, describe, expect, it } from '@jest/globals'

import { markRecapOpened, resetRecapOpened, wasRecapOpened } from '@/utils/recapStorage'

describe('recapStorage', () => {
  beforeEach(() => window.localStorage.clear())

  it('remembers and resets an opened recap', () => {
    expect(wasRecapOpened('profile-1', 2026)).toBe(false)

    markRecapOpened('profile-1', 2026)
    expect(wasRecapOpened('profile-1', 2026)).toBe(true)

    resetRecapOpened('profile-1', 2026)
    expect(wasRecapOpened('profile-1', 2026)).toBe(false)
  })

  it('keeps state separate for every profile and year', () => {
    markRecapOpened('profile-1', 2026)

    expect(wasRecapOpened('profile-2', 2026)).toBe(false)
    expect(wasRecapOpened('profile-1', 2025)).toBe(false)
  })
})
