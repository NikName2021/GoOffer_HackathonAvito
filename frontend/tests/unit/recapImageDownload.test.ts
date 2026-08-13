import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import type { RecapCardResponse } from '@/types/recap.type'
import { downloadRecapImage } from '@/utils/recapImageDownload'

const card: RecapCardResponse = {
  description: 'Описание', id: 'overview', kind: 'overview', presentation: { icon: 'sparkles', layout: 'hero', theme: 'avito-blue' }, reason: 'Тест', shareable: true, title: 'Главный итог', value: '42 сделки',
}

describe('downloadRecapImage', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: jest.fn(() => 'blob:test') })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: jest.fn() })
  })

  it('rejects an empty card selection without starting a download', async () => {
    await expect(downloadRecapImage([], [], 2026, 'responsive')).resolves.toBe(false)
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('creates a 9:16 PNG for mobile story format', async () => {
    const fillText = jest.fn()
    const context = { arc: jest.fn(), beginPath: jest.fn(), createLinearGradient: () => ({ addColorStop: jest.fn() }), fill: jest.fn(), fillRect: jest.fn(), fillText, measureText: (text: string) => ({ width: text.length * 10 }), roundRect: jest.fn() } as unknown as CanvasRenderingContext2D
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
    jest.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(new Blob(['png'], { type: 'image/png' })))
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    await expect(downloadRecapImage([card], [{ category: 'views', description: '500 просмотров', icon: '👀', slug: 'curious', title: 'Любопытный' }], 2026, 'mobile_story')).resolves.toBe(true)
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(fillText).toHaveBeenCalledWith('Самое важное за год', 60, 210)
    expect(fillText).toHaveBeenCalledWith('👀', 60, 1820)
  })
})
