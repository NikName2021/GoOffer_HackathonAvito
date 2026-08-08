import { Award } from 'lucide-react'
import { motion } from 'motion/react'

import type { RecapAchievement } from '@/types/recap.type'

interface RecapAchievementsProps {
  achievements: RecapAchievement[]
}

export function RecapAchievements({ achievements }: RecapAchievementsProps) {
  if (achievements.length === 0) return null

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {achievements.slice(0, 3).map((achievement) => (
        <motion.div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/80 bg-white/70 p-3 shadow-sm backdrop-blur-xl" key={achievement.slug} whileHover={{ rotate: -1, scale: 1.035, y: -3 }}>
          <motion.span animate={{ rotate: [0, 8, -6, 0] }} className="grid size-9 shrink-0 place-items-center rounded-2xl bg-[#fff3d6] text-[#e18400]" transition={{ duration: 4, repeat: Infinity }}>
            <Award aria-hidden="true" className="size-4" />
          </motion.span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold">{achievement.title}</p>
            <p className="mt-0.5 truncate text-[10px] text-[#6f7377]">{achievement.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
