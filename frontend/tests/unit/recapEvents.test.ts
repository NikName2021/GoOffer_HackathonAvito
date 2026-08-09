import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import { sendRecapEvent } from '@/api/recapEvents'

jest.mock('@/api/api', () => ({ API_BASE_URL: 'http://api.test/api' }))

const fetchMock = jest.fn<typeof fetch>()

describe('sendRecapEvent', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    globalThis.fetch = fetchMock
  })

  it('sends only the event payload with cookies', async () => {
    fetchMock.mockResolvedValue({ ok: true } as Response)

    await expect(sendRecapEvent({ event: 'slide_viewed', cta_visible: true })).resolves.toBe(true)

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/api/recap/events', {
      body: JSON.stringify({ event: 'slide_viewed', cta_visible: true }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      keepalive: false,
      method: 'POST',
    })
  })

  it('uses keepalive for CTA and silently handles network errors', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))

    await expect(sendRecapEvent({ event: 'cta_clicked' }, { keepalive: true })).resolves.toBe(false)
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ keepalive: true })
  })
})
