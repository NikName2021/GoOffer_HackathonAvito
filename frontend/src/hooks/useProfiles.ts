import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createProfile, getProfiles } from '@/api/profile'
import type { CreateProfileRequest } from '@/types/profileRequest.type'
import type { GetProfilesResponse } from '@/types/profileResponse.type'

const profileKeys = {
  list: (accountId: string) => ['profiles', accountId] as const,
}

export function useProfiles(accountId?: string) {
  return useQuery({
    enabled: Boolean(accountId),
    queryFn: getProfiles,
    queryKey: profileKeys.list(accountId ?? 'anonymous'),
  })
}

export function useCreateProfile(accountId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (profile: CreateProfileRequest) => createProfile(profile),
    onSuccess: (createdProfile) => {
      if (!accountId) return

      queryClient.setQueryData<GetProfilesResponse>(profileKeys.list(accountId), (profiles = []) => [
        ...profiles,
        createdProfile,
      ])
    },
  })
}
