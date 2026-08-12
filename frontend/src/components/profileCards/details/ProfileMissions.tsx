import { CheckCircle2, Flag, RotateCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useProfileMissions } from '@/hooks/useMission'

interface ProfileMissionsProps {
  enabled: boolean
  profileId: string
}

export function ProfileMissions({ enabled, profileId }: ProfileMissionsProps) {
  const missionsQuery = useProfileMissions(profileId, enabled)
  const missions = missionsQuery.data?.missions ?? []

  if (!enabled || missionsQuery.isPending) {
    return enabled ? <div className="h-24 animate-pulse rounded-3xl bg-[#f2f9fd]" /> : null
  }
  if (missionsQuery.isError) {
    return (
      <div className="rounded-3xl bg-[#fff5f6] p-4 text-sm text-[#6f7377]">
        <p>{missionsQuery.error.message}</p>
        <Button className="mt-2" onClick={() => void missionsQuery.refetch()} size="sm" variant="outline"><RotateCw className="size-4" /> Повторить</Button>
      </div>
    )
  }
  if (missions.length === 0) return null

  const grouped = missions.reduce<Map<number, typeof missions>>((result, mission) => {
    result.set(mission.recap_year, [...(result.get(mission.recap_year) ?? []), mission])
    return result
  }, new Map())

  return (
    <section className="rounded-3xl border border-[#dceffa] bg-[#f7fcff] p-4">
      <div className="flex items-center gap-2"><Flag className="size-5 text-[#00aaff]" /><h3 className="font-black text-[#1f1f1f]">Миссии</h3></div>
      <div className="mt-3 space-y-4">
        {[...grouped.entries()].map(([year, yearMissions]) => (
          <div key={year}>
            <p className="text-xs font-bold text-[#8a8d91]">Итоги {year} года</p>
            <div className="mt-2 grid gap-2">
              {yearMissions.map((mission) => (
                <article className="rounded-2xl bg-white p-3 shadow-sm" key={`${year}-${mission.code}`}>
                  <div className="flex items-center gap-2">
                    <strong className="min-w-0 flex-1 text-sm text-[#1f1f1f]">{mission.title}</strong>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${mission.status === 'completed' ? 'bg-[#dcfaea] text-[#008f45]' : 'bg-[#e8f6ff] text-[#007acc]'}`}>
                      {mission.status === 'completed' ? 'Выполнена' : 'Активна'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-[#6f7377]"><span>{mission.progress} из {mission.target}</span><span className="ml-auto font-bold">{mission.progress_percent}%</span>{mission.status === 'completed' && <CheckCircle2 className="size-4 text-[#00b956]" />}</div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#e8eaed]"><div className="h-full max-w-full rounded-full bg-[#00aaff]" style={{ width: `${mission.progress_percent}%` }} /></div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
