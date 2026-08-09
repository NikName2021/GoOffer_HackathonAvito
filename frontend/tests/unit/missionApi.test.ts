import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import { getMission, selectMission } from '@/api/mission'
import { apiClient } from '@/api/api'
import type { MissionOverview } from '@/types/mission.type'

jest.mock('@/api/api', () => ({
  apiClient: { get: jest.fn(), put: jest.fn() },
}))

const overview = { options: [], selected: null } as MissionOverview

describe('mission API', () => {
  beforeEach(() => jest.clearAllMocks())

  it('loads a mission overview for a profile and year', async () => {
    jest.mocked(apiClient.get).mockResolvedValue({ data: overview })

    await expect(getMission('profile/1', 2026)).resolves.toBe(overview)
    expect(apiClient.get).toHaveBeenCalledWith('/recap/profile%2F1/2026/mission')
  })

  it('sends only the selected mission code', async () => {
    jest.mocked(apiClient.put).mockResolvedValue({ data: overview })

    await expect(selectMission('profile-1', 2026, 'try_avito_delivery')).resolves.toBe(overview)
    expect(apiClient.put).toHaveBeenCalledWith('/recap/profile-1/2026/mission', { code: 'try_avito_delivery' })
  })
})
