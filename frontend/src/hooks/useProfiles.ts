import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createProfile, deleteProfile, getProfile, getProfiles, updateProfile } from '@/api/profile'
import type { CreateProfileRequest, UpdateProfileRequest } from '@/types/profileRequest.type'
import type {
  GetProfilesResponse,
} from '@/types/profileResponse.type'

const profileKeys = {
	 detail: (profileId: string) => ['profile', profileId] as const,
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

export function useCreateProfiles(accountId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (profiles: CreateProfileRequest[]) => {
      const results = await Promise.allSettled(profiles.map((profile) => createProfile(profile)))
      const created = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
      const errors = results.flatMap((result, index) =>
        result.status === 'rejected'
          ? [{ index, message: result.reason instanceof Error ? result.reason.message : 'Не удалось создать профиль.' }]
          : [],
      )
      return { created, errors }
    },
    onSuccess: ({ created }) => {
      if (!accountId || created.length === 0) return
      queryClient.setQueryData<GetProfilesResponse>(profileKeys.list(accountId), (profiles = []) => [
        ...profiles,
        ...created,
      ])
    },
  })
}

export function useProfileDetails(profileId?: string) {
  return useQuery({
    enabled: Boolean(profileId),
    queryFn: () => getProfile(profileId ?? ''),
    queryKey: profileKeys.detail(profileId ?? 'unknown'),
  })
}

export function useUpdateProfile(accountId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, profile }: { id: string; profile: UpdateProfileRequest }) => updateProfile(id, profile),
    onSuccess: (updatedProfile, { id }) => {
      if (accountId) {
        queryClient.setQueryData<GetProfilesResponse>(profileKeys.list(accountId), (profiles = []) =>
          profiles.map((profile) => (profile.id === updatedProfile.id ? updatedProfile : profile)),
        )
      }
      queryClient.removeQueries({ queryKey: profileKeys.detail(id) })
    },
  })
}

export function useDeleteProfile(accountId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProfile,
    onSuccess: (_, id) => {
      if (accountId) {
        queryClient.setQueryData<GetProfilesResponse>(profileKeys.list(accountId), (profiles = []) =>
          profiles.filter((profile) => profile.id !== id),
        )
      }
      queryClient.removeQueries({ queryKey: profileKeys.detail(id) })
    },
  })
}
