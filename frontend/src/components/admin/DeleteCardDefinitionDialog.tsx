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
import type { CardDefinition } from '@/types/cardDefinition.type'

interface DeleteCardDefinitionDialogProps {
  definition: CardDefinition | null
  error?: string
  isDeleting: boolean
  onConfirm: () => Promise<void>
  onOpenChange: (open: boolean) => void
}

export function DeleteCardDefinitionDialog({
  definition,
  error,
  isDeleting,
  onConfirm,
  onOpenChange,
}: DeleteCardDefinitionDialogProps) {
  async function confirm() {
    try {
      await onConfirm()
      onOpenChange(false)
    } catch {
      // Ошибка отображается из состояния мутации.
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(definition)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="mb-2 grid size-10 place-items-center rounded-full bg-[#fff0f2] text-[#ff4053]">
            <AlertTriangle className="size-5" />
          </span>
          <DialogTitle className="text-xl font-black">Удалить настройку?</DialogTitle>
          <DialogDescription>
            Карточка «{definition?.name}» больше не будет добавляться в новые итоги года.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-xs text-[#ff4053]">{error}</p>}
        <DialogFooter>
          <Button disabled={isDeleting} onClick={() => onOpenChange(false)} variant="ghost">
            Отмена
          </Button>
          <Button
            className="bg-[#ff4053] text-white hover:bg-[#e6384a]"
            disabled={isDeleting}
            onClick={() => void confirm()}
          >
            {isDeleting ? 'Удаляем…' : 'Удалить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
