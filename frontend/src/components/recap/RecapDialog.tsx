import { useState, type ReactNode } from 'react'

import { RecapExperience } from './RecapExperience'
import { RecapStatus } from './RecapStatus'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useGenerateRecap } from '@/hooks/useRecap'
import type { GetProfileResponse } from '@/types/profileResponse.type'

interface RecapDialogProps {
  children: ReactNode
  profile: GetProfileResponse
}

export function RecapDialog({ children, profile }: RecapDialogProps) {
  const [open, setOpen] = useState(false)
  const recapMutation = useGenerateRecap()
  const recapYear = new Date().getFullYear()

  function loadRecap() {
    recapMutation.reset()
    recapMutation.mutate({ user_id: profile.id, year: recapYear })
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) loadRecap()
  }

  const error = recapMutation.error instanceof Error ? recapMutation.error.message : undefined

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      {children}
      <DialogContent
        className="top-0 left-0 block h-dvh max-h-none max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none bg-[#f7f7f8] p-0 sm:top-1/2 sm:left-1/2 sm:h-[min(820px,calc(100dvh-2rem))] sm:max-w-[980px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[32px] [&_[data-slot=dialog-close]]:z-30"
      >
        <DialogTitle className="sr-only">Итоги {recapYear} года для {profile.name}</DialogTitle>
        <DialogDescription className="sr-only">Персональные итоги можно листать кнопками или свайпом.</DialogDescription>
        {recapMutation.data ? (
          <RecapExperience key={recapMutation.data.id} profile={profile} recap={recapMutation.data} />
        ) : (
          <RecapStatus error={error} onRetry={error ? loadRecap : undefined} />
        )}
      </DialogContent>
    </Dialog>
  )
}
