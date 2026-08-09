import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProfile, type CreateProfilePayload } from '@/api/recap'

export function useCreateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProfilePayload) => createProfile(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}