import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteProfile } from '@/api/recap'

export function useDeleteProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProfile(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}