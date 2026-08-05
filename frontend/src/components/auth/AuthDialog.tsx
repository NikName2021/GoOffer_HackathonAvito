import { AccountPanel } from './AccountPanel'
import { AuthForm } from './AuthForm'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { clearAuthError } from '@/store/auth'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

interface AuthDialogProps {
  onOpenChange: (open: boolean) => void
  open: boolean
}

export function AuthDialog({ onOpenChange, open }: AuthDialogProps) {
  const dispatch = useAppDispatch()
  const account = useAppSelector((state) => state.auth.account)

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) dispatch(clearAuthError())
    onOpenChange(nextOpen)
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="gap-5 rounded-[28px] p-5 sm:max-w-md sm:p-6">
        <DialogHeader className="pr-10">
          <DialogTitle className="text-xl font-bold text-[#1f1f1f]">
            {account ? 'Ваш аккаунт' : 'Войти в Итоги года'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#8a8d91]">
            {account ? 'Управление текущей сессией.' : 'Авторизуйтесь или создайте новый аккаунт.'}
          </DialogDescription>
        </DialogHeader>

        {account ? (
          <AccountPanel onLogout={() => handleOpenChange(false)} />
        ) : (
          <AuthForm onSuccess={() => handleOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}
