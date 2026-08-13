import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import { getMission, getProfileMissions, selectMissions } from '@/api/mission'
import { apiClient } from '@/api/api'
import type { MissionOverview } from '@/types/mission.type'

jest.mock('@/api/api', () => ({
  apiClient: { get: jest.fn(), put: jest.fn() },
}))

const overview = { options: [], selected: null, selected_missions: [] } as MissionOverview

describe('mission API', () => {
  beforeEach(() => jest.clearAllMocks())

  it('loads a mission overview for a profile and year', async () => {
    jest.mocked(apiClient.get).mockResolvedValue({ data: overview })

    await expect(getMission('profile/1', 2026)).resolves.toBe(overview)
    expect(apiClient.get).toHaveBeenCalledWith('/recap/profile%2F1/2026/mission')
  })

  it('sends the full selected mission set', async () => {
    jest.mocked(apiClient.put).mockResolvedValue({ data: overview })

    await expect(selectMissions('profile-1', 2026, ['sell_three_items', 'try_avito_delivery'])).resolves.toBe(overview)
    expect(apiClient.put).toHaveBeenCalledWith('/recap/profile-1/2026/mission', {
      codes: ['sell_three_items', 'try_avito_delivery'],
    })
  })

  it('supports clearing missions and loads profile missions', async () => {
    jest.mocked(apiClient.put).mockResolvedValue({ data: overview })
    jest.mocked(apiClient.get).mockResolvedValue({ data: { missions: [] } })

    await selectMissions('profile-1', 2026, [])
    await getProfileMissions('profile/1')

    expect(apiClient.put).toHaveBeenCalledWith('/recap/profile-1/2026/mission', { codes: [] })
    expect(apiClient.get).toHaveBeenCalledWith('/profiles/profile%2F1/missions')
  })
})
