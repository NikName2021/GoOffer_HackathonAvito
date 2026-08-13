import { useMutation, useQuery } from '@tanstack/react-query'

import { createRecapShare, generateRecap, getPublicRecapShare } from '@/api/recap'
import type { CreateRecapShareRequest } from '@/types/recap.type'

export function useGenerateRecap() {
  return useMutation({ mutationFn: generateRecap })
}

export function useCreateRecapShare() {
  return useMutation({
    mutationFn: ({ request, userId, year }: { request: CreateRecapShareRequest; userId: string; year: number }) =>
      createRecapShare(userId, year, request),
  })
}

export function usePublicRecapShare(token: string) {
  return useQuery({
    enabled: Boolean(token),
    queryFn: () => getPublicRecapShare(token),
    queryKey: ['public-recap-share', token],
    retry: false,
  })
}
