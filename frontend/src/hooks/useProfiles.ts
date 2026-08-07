import { useQuery } from '@tanstack/react-query'
import { fetchProfiles } from '@/api/recap'
import { BACKEND_PROFILES } from '@/constants/backendProfiles'

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: fetchProfiles,
    placeholderData: BACKEND_PROFILES.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      profile_type: p.profile_type,
    })),
  })
}

export function profileMeta(userId: string) {
  return BACKEND_PROFILES.find((p) => p.id === userId)
}