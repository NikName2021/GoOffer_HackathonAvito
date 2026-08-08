import { useQuery } from '@tanstack/react-query'
import { fetchProfiles } from '@/api/recap'
import { BACKEND_PROFILES } from '@/constants/backendProfiles'
import type { ApiProfile } from '@/types/recap.type'

const placeholderProfiles: ApiProfile[] = BACKEND_PROFILES.map((p) => ({
  id: p.id,
  name: p.name,
  avatar: p.avatar,
  profile_type: p.profile_type,
}))

export function useProfiles() {
  return useQuery<ApiProfile[]>({
    queryKey: ['profiles'],
    queryFn: fetchProfiles,
    placeholderData: placeholderProfiles,
  })
}

export function profileMeta(userId: string) {
  return BACKEND_PROFILES.find((p) => p.id === userId)
}