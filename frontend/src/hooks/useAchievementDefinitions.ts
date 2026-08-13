import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getAchievementDefinitionOptions,
  getAchievementDefinitions,
  updateAchievementDefinition,
} from '@/api/achievementDefinitions'
import type { AchievementDefinitionRequest } from '@/types/achievementDefinition.type'

const achievementDefinitionKeys = {
  all: ['admin', 'achievement-definitions'] as const,
  options: ['admin', 'achievement-definitions', 'options'] as const,
}

export function useAchievementDefinitions(enabled: boolean) {
  return useQuery({ enabled, queryFn: getAchievementDefinitions, queryKey: achievementDefinitionKeys.all })
}

export function useAchievementDefinitionOptions(enabled: boolean) {
  return useQuery({ enabled, queryFn: getAchievementDefinitionOptions, queryKey: achievementDefinitionKeys.options })
}

export function useUpdateAchievementDefinition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ definition, slug }: { definition: AchievementDefinitionRequest; slug: string }) =>
      updateAchievementDefinition(slug, definition),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: achievementDefinitionKeys.all }),
  })
}
