import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { PublicRecapAchievement } from '@/types/recap.type'

interface PublicShareAchievementsProps {
  achievements: PublicRecapAchievement[]
}

export function PublicShareAchievements({ achievements }: PublicShareAchievementsProps) {
  if (achievements.length === 0) return null

  return (
    <aside className="mt-6 rounded-[24px] border border-white/80 bg-white/65 p-4 shadow-sm backdrop-blur-xl" aria-label="Полученные медали">
      <p className="text-xs font-black tracking-[0.14em] text-[#8a8d91] uppercase">Ваши медали</p>
      <TooltipProvider>
        <div className="mt-3 flex flex-wrap gap-3">
          {achievements.map((achievement) => (
            <Tooltip key={achievement.slug}>
              <TooltipTrigger
                aria-label={`${achievement.title}. ${achievement.description}`}
                className="grid size-12 place-items-center rounded-2xl border border-[#dff3ff] bg-gradient-to-br from-white to-[#eaf8ff] text-2xl shadow-[0_8px_24px_rgba(0,170,255,0.12)] transition hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,170,255,0.2)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#00aaff]/25"
              >
                <span aria-hidden="true">{achievement.icon}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-bold">{achievement.title}</p>
                <p className="mt-1 text-white/75">{achievement.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </aside>
  )
}
