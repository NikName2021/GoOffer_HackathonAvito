import type { ReactNode } from 'react'
import { CalendarDays } from 'lucide-react'

import { ActivityHistory } from './details/ActivityHistory'
import { ProfileYearSummary } from './details/ProfileYearSummary'
import { ProfileImage } from './ProfileImage'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { GetProfileResponse } from '@/types/profileResponse.type'
import { formatDate } from '@/utils/formatterDate'

interface ProfileDetailsDialogProps {
  children: ReactNode
  profile: GetProfileResponse
}

export function ProfileDetailsDialog({ children, profile }: ProfileDetailsDialogProps) {
  return (
    <Dialog>
      {children}
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[28px] p-5 sm:max-w-2xl sm:p-7">
        <DialogHeader className="pr-10">
          <div className="flex items-center gap-4">
            <ProfileImage profile={profile} size="large" />
            <div>
              <DialogTitle className="text-xl font-bold text-[#1f1f1f] sm:text-2xl">{profile.name}</DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-1.5 text-[#8a8d91]">
                <CalendarDays aria-hidden="true" className="size-3.5" />
                С {formatDate(profile.joinedAt)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ProfileYearSummary profile={profile} />
        <ActivityHistory profile={profile} />
      </DialogContent>
    </Dialog>
  )
}
