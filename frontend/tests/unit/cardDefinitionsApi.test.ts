import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import {
  createCardDefinition,
  deleteCardDefinition,
  getCardDefinitionOptions,
  getCardDefinitions,
  updateCardDefinition,
} from '@/api/cardDefinitions'
import { apiClient } from '@/api/api'
import type { CardDefinition, CardDefinitionOptions, CardDefinitionRequest } from '@/types/cardDefinition.type'

jest.mock('@/api/api', () => ({
  apiClient: { delete: jest.fn(), get: jest.fn(), post: jest.fn(), put: jest.fn() },
}))

const request = {
  analysis: 'total',
  condition_operator: 'always',
  description: '',
  icon: 'chart',
  is_active: true,
  kind: 'statistic',
  layout: 'statistic',
  metric: 'total_views',
  name: 'Активность',
  shareable: true,
  sort_order: 100,
  theme: 'avito-purple',
  title: 'Ваш год',
  value_suffix: '',
} as CardDefinitionRequest
const definition = { ...request, created_at: '', created_by: '', id: 'id/1', updated_at: '' } as CardDefinition

describe('admin card definitions API', () => {
  beforeEach(() => jest.clearAllMocks())

  it('loads options and configured cards', async () => {
    const options = { metrics: [] } as unknown as CardDefinitionOptions
    jest
      .mocked(apiClient.get)
      .mockResolvedValueOnce({ data: options })
      .mockResolvedValueOnce({ data: { items: [definition] } })
    await expect(getCardDefinitionOptions()).resolves.toBe(options)
    await expect(getCardDefinitions()).resolves.toEqual([definition])
  })

  it('creates, updates and deletes a definition', async () => {
    jest.mocked(apiClient.post).mockResolvedValue({ data: definition })
    jest.mocked(apiClient.put).mockResolvedValue({ data: definition })
    jest.mocked(apiClient.delete).mockResolvedValue({})

    await expect(createCardDefinition(request)).resolves.toBe(definition)
    await expect(updateCardDefinition('id/1', request)).resolves.toBe(definition)
    await expect(deleteCardDefinition('id/1')).resolves.toBeUndefined()
    expect(apiClient.put).toHaveBeenCalledWith('/admin/card-definitions/id%2F1', request)
    expect(apiClient.delete).toHaveBeenCalledWith('/admin/card-definitions/id%2F1')
  })
})
