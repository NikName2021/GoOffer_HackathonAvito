import type { Achievement } from '@/types/recap.type'

export function AchievementBadge({ achievement }: { achievement: Achievement }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#e7e9eb] bg-white p-4 shadow-sm">
      <span className="text-2xl" aria-hidden>
        {achievement.icon || '🏅'}
      </span>
      <div>
        <p className="font-semibold text-[#1f1f1f]">{achievement.title}</p>
        <p className="mt-0.5 text-sm text-[#6f7377]">{achievement.description}</p>
      </div>
    </div>
  )
}