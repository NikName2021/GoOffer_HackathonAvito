import { Eye, Megaphone, UserRound } from 'lucide-react'

import type { CreateProfileRequest } from '@/types/profileRequest.type'
import type { CreateProfileSection } from './validateCreateProfile'

const sections = [
  { id: 'profile', icon: UserRound, label: 'Профиль' },
  { id: 'ads', icon: Megaphone, label: 'Объявления/Продажи' },
  { id: 'views', icon: Eye, label: 'Просмотры/Покупки' },
] as const

interface ProfileFormTabsProps {
  activeSection: CreateProfileSection
  onChange: (section: CreateProfileSection) => void
  profile: CreateProfileRequest
}

export function ProfileFormTabs({ activeSection, onChange, profile }: ProfileFormTabsProps) {
  return (
    <nav aria-label="Разделы формы" className="grid grid-cols-3 gap-1 rounded-2xl bg-[#f2f3f5] p-1">
      {sections.map(({ id, icon: Icon, label }) => {
        const count = id === 'ads' ? profile.ownAds.length : id === 'views' ? profile.views.length : null
        const isActive = activeSection === id

        return (
          <button
            aria-current={isActive ? 'step' : undefined}
            className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition ${
              isActive ? 'bg-white text-[#1f1f1f] shadow-sm' : 'text-[#6f7377] hover:text-[#1f1f1f]'
            }`}
            key={id}
            onClick={() => onChange(id)}
            type="button"
          >
            <Icon aria-hidden="true" className={`size-4 ${isActive ? 'text-[#00aaff]' : ''}`} />
            <span className="truncate">{label}</span>
            {count !== null && count > 0 && (
              <span className="rounded-full bg-[#e8f6ff] px-1.5 text-[10px] text-[#00aaff]">{count}</span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
