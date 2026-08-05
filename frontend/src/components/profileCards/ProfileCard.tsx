import { Pencil, Trash2 } from 'lucide-react'

import { DialogTrigger } from '@/components/ui/dialog'
import { ProfileCardHighlights } from './ProfileCardHighlights'
import { ProfileDetailsDialog } from './ProfileDetailsDialog'
import { ProfileImage } from './ProfileImage'
import type { GetProfileResponse } from '@/types/profileResponse.type'
import { formatDateSince } from '@/utils/formatterDate'
import { getProfileAccent } from '@/utils/profileAppearance'

interface ProfileCardProps {
  onDelete: (profile: GetProfileResponse) => void
  onEdit: (profileId: string) => void
  profile: GetProfileResponse
}

export function ProfileCard({ onDelete, onEdit, profile }: ProfileCardProps) {
  const accentColor = getProfileAccent(profile.name)

  return (
    <article className="overflow-hidden rounded-[24px] border border-[#eceeef] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)]">
      <span aria-hidden="true" className="block h-1" style={{ backgroundColor: accentColor }} />

      <header className="flex items-center gap-4 px-5 pt-4">
        <ProfileImage profile={profile} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-bold leading-tight tracking-tight text-[#1f1f1f]">{profile.name}</h2>
          <p className="mt-0.5 text-xs text-[#8a8d91]">{formatDateSince(profile.joinedAt)}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            aria-label="Редактировать профиль"
            className="cursor-pointer flex size-8 items-center justify-center rounded-xl text-white shadow-sm transition hover:brightness-95 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#00b956]"
            onClick={() => onEdit(profile.id)}
            style={{ backgroundColor: '#00b956' }}
            type="button"
          >
            <Pencil aria-hidden="true" className="size-4" />
          </button>
          <button
            aria-label="Удалить профиль"
            className="cursor-pointer flex size-8 items-center justify-center rounded-xl bg-[#ff4053] text-white shadow-sm transition hover:bg-[#e6384a] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#ff4053]"
            onClick={() => onDelete(profile)}
            type="button"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        </div>
      </header>

      <ProfileDetailsDialog profile={profile}>
        <DialogTrigger className="block min-h-[218px] w-full cursor-pointer px-5 pt-5 pb-5 text-left focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-[#00aaff]">
          <ProfileCardHighlights highlights={profile.highlights} stats={profile.stats} />
        </DialogTrigger>
      </ProfileDetailsDialog>
    </article>
  )
}
