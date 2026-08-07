import { useMutation } from '@tanstack/react-query'

import { generateRecap } from '@/api/recap'

export function useGenerateRecap() {
  return useMutation({ mutationFn: generateRecap })
}
