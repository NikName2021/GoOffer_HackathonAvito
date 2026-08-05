import { CalendarDays, LogOut, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { logoutAccount } from '@/store/auth'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

interface AccountPanelProps {
  onLogout: () => void
}

const accountDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function AccountPanel({ onLogout }: AccountPanelProps) {
  const dispatch = useAppDispatch()
  const { account, error, status } = useAppSelector((state) => state.auth)
  if (!account) return null

  async function handleLogout() {
    try {
      await dispatch(logoutAccount()).unwrap()
      onLogout()
    } catch {
      // Сообщение отображается из auth slice.
    }
  }

  return (
    <>
      <div className="rounded-3xl bg-[#f2f9ff] p-5 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#00aaff] text-xl font-bold text-white">
          {account.login.slice(0, 1).toUpperCase()}
        </span>
        <h3 className="mt-3 text-lg font-bold text-[#1f1f1f]">{account.login}</h3>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-[#6f7377]">
          <CalendarDays aria-hidden="true" className="size-3.5" />
          Аккаунт создан {accountDateFormatter.format(new Date(account.createdAt))}
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-[#e7e9eb] p-3.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e7faef] text-[#00b956]">
          <ShieldCheck aria-hidden="true" className="size-4" />
        </span>
        <div>
          <p className="text-xs font-semibold text-[#1f1f1f]">Безопасная сессия</p>
          <p className="mt-0.5 text-[11px] leading-4 text-[#8a8d91]">
            Данные аккаунта восстановлены из Redux и проверены сервером.
          </p>
        </div>
      </div>

      <p aria-live="polite" className="min-h-4 text-center text-xs text-[#ff4053]">
        {error}
      </p>

      <Button
        className="h-10 w-full gap-2"
        disabled={status === 'logging-out'}
        onClick={handleLogout}
        type="button"
        variant="outline"
      >
        <LogOut aria-hidden="true" className="size-4" />
        {status === 'logging-out' ? 'Выходим…' : 'Выйти из аккаунта'}
      </Button>
    </>
  )
}
