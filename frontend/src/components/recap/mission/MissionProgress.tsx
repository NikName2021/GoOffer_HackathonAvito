import { ArrowUpRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { MissionIcon } from './MissionIcon'
import { sendRecapEvent } from '@/api/recapEvents'
import { DialogClose } from '@/components/ui/dialog'
import type { MissionState } from '@/types/mission.type'
import { getRecapCtaUrl } from '@/utils/recapCta'

interface MissionProgressProps {
  mission: MissionState
  profileId: string
}

export function MissionProgress({ mission, profileId }: MissionProgressProps) {
  const isCompleted = mission.status === 'completed'
  const progress = Math.min(100, Math.max(0, mission.progress_percent))

  return (
    <div className="mt-4 rounded-3xl border border-white/90 bg-white/85 p-4 shadow-[0_16px_40px_rgba(31,31,31,0.08)] backdrop-blur sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#e5f6ff] text-[#00aaff]">
          <MissionIcon className="size-6" name={mission.icon} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-black text-[#1f1f1f]">{mission.title}</h4>
            <span className="rounded-full bg-[#dcfaea] px-2.5 py-1 text-[11px] font-bold text-[#008f45]">
              {isCompleted ? 'Выполнено' : 'В процессе'}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-[#6f7377]">{mission.description}</p>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <span className="text-sm font-bold text-[#1f1f1f]">{mission.progress} из {mission.target}</span>
        <span className="text-xs font-bold text-[#8a8d91]">{progress}%</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#e8eaed]">
        <div className="h-full rounded-full bg-gradient-to-r from-[#00aaff] via-[#00d667] to-[#a169f7] transition-[width] duration-700" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-4">
        <DialogClose
          nativeButton={false}
          render={<Link className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#00aaff] px-5 text-sm font-bold text-white transition hover:bg-[#0099f7]" onClick={() => void sendRecapEvent({ event: 'mission_cta_clicked' }, { keepalive: true })} to={getRecapCtaUrl(mission.cta, profileId)} />}
        >
          {isCompleted ? <CheckCircle2 className="size-4" /> : <ArrowUpRight className="size-4" />}
          {mission.cta.label}
        </DialogClose>
      </div>
    </div>
  )
}
