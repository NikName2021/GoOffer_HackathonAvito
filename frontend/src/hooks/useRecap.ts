import { useMutation } from '@tanstack/react-query'

import { generateRecap, getShareRecap } from '@/api/recap'

export function useGenerateRecap() {
  return useMutation({ mutationFn: generateRecap })
}

export function useShareRecap() {
  return useMutation({
    mutationFn: ({ userId, year }: { userId: string; year: number }) => getShareRecap(userId, year),
  })
}
