import { DialogTrigger } from '@/components/ui/dialog'
import { ProfileCardHighlights } from './ProfileCardHighlights'
import { ProfileDetailsDialog } from './ProfileDetailsDialog'
import { ProfileImage } from './ProfileImage'
import type { GetProfileResponse } from '@/types/profileResponse.type'
import { formatDateSince } from '@/utils/formatterDate'
import { getProfileAccent } from '@/utils/profileAppearance'

interface ProfileCardProps {
  profile: GetProfileResponse
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const accentColor = getProfileAccent(profile.name)

  return (
    <ProfileDetailsDialog profile={profile}>
      <DialogTrigger className="group relative h-full min-h-[360px] cursor-pointer overflow-hidden rounded-[24px] border border-[#eceeef] bg-white p-5 text-left shadow-[0_2px_16px_rgba(0,0,0,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#00aaff]">
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: accentColor }} />

        <div className="flex items-center gap-4">
          <ProfileImage profile={profile} />
          <div className="min-w-0">
            <h2 className="text-base font-bold leading-tight tracking-tight text-[#1f1f1f]">{profile.name}</h2>
            <p className="mt-0.5 text-xs text-[#8a8d91]">{formatDateSince(profile.joinedAt)}</p>
          </div>
        </div>

        <ProfileCardHighlights highlights={profile.highlights} stats={profile.stats} />
      </DialogTrigger>
    </ProfileDetailsDialog>
  )
}
