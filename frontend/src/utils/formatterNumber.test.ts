import { describe, it, expect } from 'vitest'
import { formatCount } from './formatterNumber'

describe('formatCount', () => {
  it('форматирует ноль', () => {
    expect(formatCount(0)).toBeDefined()
    expect(String(formatCount(0))).toMatch(/0/)
  })

  it('форматирует обычное число', () => {
    const out = formatCount(620)
    expect(String(out)).toMatch(/620/)
  })

  it('форматирует большое число', () => {
    const out = formatCount(1500)
    expect(out).toBeTruthy()
  })
})