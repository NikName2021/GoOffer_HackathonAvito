import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createCardDefinition,
  deleteCardDefinition,
  getCardDefinitionOptions,
  getCardDefinitions,
  updateCardDefinition,
} from '@/api/cardDefinitions'
import type { CardDefinitionRequest } from '@/types/cardDefinition.type'

const cardDefinitionKeys = {
  all: ['admin', 'card-definitions'] as const,
  options: ['admin', 'card-definitions', 'options'] as const,
}

export function useCardDefinitionOptions(enabled: boolean) {
  return useQuery({ enabled, queryFn: getCardDefinitionOptions, queryKey: cardDefinitionKeys.options })
}

export function useCardDefinitions(enabled: boolean) {
  return useQuery({ enabled, queryFn: getCardDefinitions, queryKey: cardDefinitionKeys.all })
}

export function useCreateCardDefinition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCardDefinition,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cardDefinitionKeys.all }),
  })
}

export function useUpdateCardDefinition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ definition, id }: { definition: CardDefinitionRequest; id: string }) =>
      updateCardDefinition(id, definition),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cardDefinitionKeys.all }),
  })
}

export function useDeleteCardDefinition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCardDefinition,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cardDefinitionKeys.all }),
  })
}
