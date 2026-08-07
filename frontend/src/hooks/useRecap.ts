import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchRecap, fetchShareRecap, generateRecap } from '@/api/recap'

export function useGenerateRecap() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, year }: { userId: string; year: number }) =>
      generateRecap(userId, year),
    onSuccess: (data) => {
      // сразу кладём свежий recap в кэш UI
      qc.setQueryData(['recap', data.user_id, data.year], data)
      qc.invalidateQueries({ queryKey: ['recap-share', data.user_id, data.year] })
    },
  })
}

export function useRecap(userId: string, year: number, enabled = true) {
  return useQuery({
    queryKey: ['recap', userId, year],
    queryFn: () => fetchRecap(userId, year),
    enabled: enabled && Boolean(userId) && year > 0,
    retry: false,
  })
}

export function useShareRecap(userId: string, year: number, enabled = true) {
  return useQuery({
    queryKey: ['recap-share', userId, year],
    queryFn: () => fetchShareRecap(userId, year),
    enabled: enabled && Boolean(userId) && year > 0,
    retry: false,
  })
}