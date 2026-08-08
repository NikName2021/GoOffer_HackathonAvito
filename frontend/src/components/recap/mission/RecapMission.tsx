import { Flag, RotateCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { MissionOptions } from './MissionOptions'
import { MissionProgress } from './MissionProgress'
import { sendRecapEvent } from '@/api/recapEvents'
import { Button } from '@/components/ui/button'
import { useMission, useSelectMission } from '@/hooks/useMission'
import type { MissionCode } from '@/types/mission.type'

interface RecapMissionProps {
  profileId: string
  year: number
}

export function RecapMission({ profileId, year }: RecapMissionProps) {
  const missionQuery = useMission(profileId, year)
  const selectMutation = useSelectMission(profileId, year)
  const [isChoosing, setIsChoosing] = useState(false)
  const viewedRef = useRef(false)
  const completedRef = useRef(false)
  const overview = missionQuery.data

  useEffect(() => {
    if (!overview || viewedRef.current) return
    viewedRef.current = true
    void sendRecapEvent({ event: 'mission_viewed' })
  }, [overview])

  useEffect(() => {
    if (overview?.selected?.status !== 'completed' || completedRef.current) return
    completedRef.current = true
    void sendRecapEvent({ event: 'mission_completed' })
  }, [overview?.selected?.status])

  function handleSelect(code: MissionCode) {
    selectMutation.mutate(code, {
      onSuccess: () => {
        setIsChoosing(false)
        void sendRecapEvent({ event: 'mission_selected' })
      },
    })
  }

  if (missionQuery.isPending) {
    return <div className="mt-5 h-44 animate-pulse rounded-3xl bg-white/60" />
  }

  if (missionQuery.isError || !overview) {
    return (
      <div className="mt-5 rounded-3xl border border-white/80 bg-white/70 p-4 text-sm text-[#6f7377]">
        <p>{missionQuery.error?.message || 'Не удалось загрузить миссии.'}</p>
        <Button className="mt-3" onClick={() => void missionQuery.refetch()} size="sm" variant="outline">
          <RotateCw className="size-4" /> Повторить
        </Button>
      </div>
    )
  }

  return (
    <section className="mt-5 rounded-[28px] border border-[#bdeaff] bg-gradient-to-br from-[#edf9ff] via-white to-[#f1ebff] p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-[#00aaff] text-white shadow-lg shadow-[#00aaff]/20"><Flag className="size-5" /></span>
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-[#00aaff] uppercase">Продолжение истории</p>
          <h3 className="text-xl font-black text-[#1f1f1f]">Миссия на следующий год</h3>
        </div>
      </div>

      {overview.selected && !isChoosing ? (
        <MissionProgress mission={overview.selected} onChange={() => setIsChoosing(true)} profileId={profileId} />
      ) : (
        <MissionOptions currentCode={overview.selected?.code} isPending={selectMutation.isPending} onSelect={handleSelect} options={overview.options} />
      )}
      {selectMutation.isError && <p className="mt-3 text-sm text-[#ff4053]">{selectMutation.error.message}</p>}
    </section>
  )
}
