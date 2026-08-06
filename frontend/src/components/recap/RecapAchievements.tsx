import { Award } from 'lucide-react'

import type { RecapAchievement } from '@/types/recap.type'

interface RecapAchievementsProps {
  achievements: RecapAchievement[]
}

export function RecapAchievements({ achievements }: RecapAchievementsProps) {
  if (achievements.length === 0) return null

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {achievements.slice(0, 3).map((achievement) => (
        <div className="flex min-w-0 items-center gap-2 rounded-2xl bg-white/75 p-3" key={achievement.slug}>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#fff3d6] text-[#e18400]">
            <Award aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold">{achievement.title}</p>
            <p className="mt-0.5 truncate text-[10px] text-[#6f7377]">{achievement.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
