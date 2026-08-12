import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import axios from 'axios'

import { apiClient } from '@/api/api'
import { createRecapShare, getPublicRecapShare } from '@/api/recap'

jest.mock('axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), isAxiosError: jest.fn() },
}))

jest.mock('@/api/api', () => ({
  API_BASE_URL: 'http://localhost:8000/api',
  apiClient: { post: jest.fn() },
}))

describe('recap public share API', () => {
  beforeEach(() => jest.clearAllMocks())

  it('creates a share from selected card ids and format', async () => {
    const request = { card_ids: ['year_overview', 'category_mix'], format: 'responsive' as const }
    const response = { id: 'share-id', public_url: '/share/token', ...request }
    jest.mocked(apiClient.post).mockResolvedValue({ data: response })

    await expect(createRecapShare('profile/id', 2026, request)).resolves.toBe(response)
    expect(apiClient.post).toHaveBeenCalledWith('/recap/profile%2Fid/2026/shares', request)
  })

  it('loads a public snapshot without credentials', async () => {
    const response = { cards: [], format: 'responsive', year: 2026 }
    jest.mocked(axios.get).mockResolvedValue({ data: response })

    await expect(getPublicRecapShare('public/token')).resolves.toBe(response)
    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:8000/api/public/recap-shares/public%2Ftoken',
      { withCredentials: false },
    )
  })

  it('maps a public 404 to the expired-link message', async () => {
    const error = { response: { status: 404 } }
    jest.mocked(axios.get).mockRejectedValue(error)
    jest.mocked(axios.isAxiosError).mockReturnValue(true)

    await expect(getPublicRecapShare('expired')).rejects.toThrow('Ссылка недействительна или срок её действия истёк.')
  })
})
