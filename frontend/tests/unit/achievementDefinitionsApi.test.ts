import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import { apiClient } from '@/api/api'
import {
  getAchievementDefinitionOptions,
  getAchievementDefinitions,
  updateAchievementDefinition,
} from '@/api/achievementDefinitions'
import type {
  AchievementDefinition,
  AchievementDefinitionOptions,
  AchievementDefinitionRequest,
} from '@/types/achievementDefinition.type'

jest.mock('@/api/api', () => ({
  apiClient: { get: jest.fn(), put: jest.fn() },
}))

const request: AchievementDefinitionRequest = {
  condition_operator: 'gte',
  condition_value: 750,
  description: 'Просмотрел не менее 750 объявлений за год',
  icon: '👀',
  is_active: true,
  metric: 'total_views',
  title: 'Любопытный',
}

const achievement = {
  ...request,
  category: 'views',
  slug: 'curious/2026',
  sort_order: 10,
  updated_at: '2026-08-12T00:00:00Z',
} as AchievementDefinition

describe('admin achievement definitions API', () => {
  beforeEach(() => jest.clearAllMocks())

  it('loads achievement list and options', async () => {
    const options = { conditions: ['always'], metrics: ['total_views'] } as AchievementDefinitionOptions
    jest
      .mocked(apiClient.get)
      .mockResolvedValueOnce({ data: { items: [achievement] } })
      .mockResolvedValueOnce({ data: options })

    await expect(getAchievementDefinitions()).resolves.toEqual([achievement])
    await expect(getAchievementDefinitionOptions()).resolves.toBe(options)
    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/admin/achievement-definitions')
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/admin/achievement-definitions/options')
  })

  it('updates achievement with encoded slug and editable fields only', async () => {
    jest.mocked(apiClient.put).mockResolvedValue({ data: achievement })

    await expect(updateAchievementDefinition('curious/2026', request)).resolves.toBe(achievement)
    expect(apiClient.put).toHaveBeenCalledWith('/admin/achievement-definitions/curious%2F2026', request)
  })
})
