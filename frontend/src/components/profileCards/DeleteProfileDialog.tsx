import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { GetProfileResponse } from '@/types/profileResponse.type'

interface DeleteProfileDialogProps {
  error?: string
  isDeleting: boolean
  onConfirm: () => Promise<void>
  onOpenChange: (open: boolean) => void
  profile: GetProfileResponse | null
}

export function DeleteProfileDialog({ error, isDeleting, onConfirm, onOpenChange, profile }: DeleteProfileDialogProps) {
  async function handleConfirm() {
    try {
      await onConfirm()
      onOpenChange(false)
    } catch {
      // Ошибка уже остаётся в состоянии мутации и не закрывает подтверждение.
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(profile)}>
      <DialogContent className="rounded-[28px] p-6 sm:max-w-md">
        <DialogHeader>
          <span className="mb-2 flex size-10 items-center justify-center rounded-full bg-[#fff1f2] text-[#ff4053]">
            <AlertTriangle aria-hidden="true" className="size-5" />
          </span>
          <DialogTitle className="text-xl font-bold text-[#1f1f1f]">Удалить профиль?</DialogTitle>
          <DialogDescription className="leading-5 text-[#6f7377]">
            Карточка «{profile?.name}» и её данные будут удалены без возможности восстановления.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-2 sm:justify-end">
          {error && <p aria-live="polite" className="mr-auto text-xs text-[#ff4053]">{error}</p>}
          <Button disabled={isDeleting} onClick={() => onOpenChange(false)} variant="ghost">Отмена</Button>
          <Button className="bg-[#ff4053] text-white hover:bg-[#e6384a]" disabled={isDeleting} onClick={() => void handleConfirm()}>
            {isDeleting ? 'Удаляем…' : 'Удалить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
