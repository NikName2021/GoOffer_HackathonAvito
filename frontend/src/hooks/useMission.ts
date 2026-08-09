import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getMission, selectMission } from '@/api/mission'
import type { MissionCode, MissionOverview } from '@/types/mission.type'

const missionKeys = {
  detail: (userId: string, year: number) => ['recap-mission', userId, year] as const,
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
    mutationFn: (code: MissionCode) => selectMission(userId, year, code),
    onSuccess: (overview: MissionOverview) => {
      queryClient.setQueryData(missionKeys.detail(userId, year), overview)
    },
  })
}
