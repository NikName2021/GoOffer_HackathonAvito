import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getMission, getProfileMissions, selectMissions } from '@/api/mission'
import type { MissionCode, MissionOverview } from '@/types/mission.type'

const missionKeys = {
  detail: (userId: string, year: number) => ['recap-mission', userId, year] as const,
  profile: (profileId: string) => ['profile-missions', profileId] as const,
}

export function useMission(userId: string, year: number) {
  return useQuery({
    queryFn: () => getMission(userId, year),
    queryKey: missionKeys.detail(userId, year),
  })
}

export function useSelectMission(userId: string, year: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (codes: MissionCode[]) => selectMissions(userId, year, codes),
    onSuccess: (overview: MissionOverview) => {
      queryClient.setQueryData(missionKeys.detail(userId, year), overview)
      void queryClient.invalidateQueries({ queryKey: missionKeys.profile(userId) })
    },
  })
}

export function useProfileMissions(profileId: string, enabled: boolean) {
  return useQuery({
    enabled,
    queryFn: () => getProfileMissions(profileId),
    queryKey: missionKeys.profile(profileId),
  })
}
