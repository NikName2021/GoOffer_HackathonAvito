import { Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { clearAuthError, loginAccount, registerAccount } from '@/store/auth'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

type AuthMode = 'login' | 'register'

interface AuthFormProps {
  onSuccess: () => void
}

const inputClassName =
  'w-full rounded-xl border border-[#dfe1e3] bg-white py-2.5 pr-3 pl-10 text-sm text-[#1f1f1f] outline-none transition placeholder:text-[#a1a4a7] focus:border-[#00aaff] focus:ring-3 focus:ring-[#00aaff]/15'

export function AuthForm({ onSuccess }: AuthFormProps) {
  const dispatch = useAppDispatch()
  const { error, status } = useAppSelector((state) => state.auth)
  const [mode, setMode] = useState<AuthMode>('login')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [isShowPassword, setIsShowPassword] = useState(false)
  const isSubmitting = status === 'submitting'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const action = mode === 'login' ? loginAccount({ login, password }) : registerAccount({ login, password })

    try {
      await dispatch(action).unwrap()
      onSuccess()
    } catch {
      // Ошибка запроса уже записана в auth slice.
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode)
    setPassword('')
    dispatch(clearAuthError())
  }

  return (
    <>
      <div className="grid grid-cols-2 rounded-2xl bg-[#f2f3f5] p-1">
        <ModeButton active={mode === 'login'} onClick={() => changeMode('login')}>
          Вход
        </ModeButton>
        <ModeButton active={mode === 'register'} onClick={() => changeMode('register')}>
          Регистрация
        </ModeButton>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-xs font-medium text-[#6f7377]">
          Логин
          <span className="relative mt-1.5 block">
            <UserRound aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8a8d91]" />
            <input
              autoComplete="username"
              className={inputClassName}
              maxLength={32}
              minLength={3}
              onChange={(event) => setLogin(event.target.value)}
              placeholder="Ваш логин"
              required
              value={login}
            />
          </span>
        </label>

        <label className="block text-xs font-medium text-[#6f7377]">
          Пароль
          <span className="relative mt-1.5 block">
            <LockKeyhole aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8a8d91]" />
            <input
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className={`${inputClassName} pr-10`}
              maxLength={128}
              minLength={mode === 'register' ? 8 : undefined}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === 'register' ? 'Не менее 8 символов' : 'Ваш пароль'}
              required
              type={isShowPassword ? 'text' : 'password'}
              value={password}
            />
            <button
              aria-label={isShowPassword ? 'Скрыть пароль' : 'Показать пароль'}
              className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-[#8a8d91] hover:bg-[#f2f3f5]"
              onClick={() => setIsShowPassword((current) => !current)}
              type="button"
            >
              {isShowPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </span>
        </label>

        <p aria-live="polite" className="min-h-4 text-xs text-[#ff4053]">
          {error}
        </p>

        <Button
          className="h-11 w-full bg-[#00aaff] text-sm font-semibold text-white hover:bg-[#0099e6]"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
        </Button>
      </form>

      <p className="text-center text-[11px] leading-4 text-[#8a8d91]">
        Сессия хранится в защищённой HttpOnly-cookie. Пароль не сохраняется на устройстве.
      </p>
    </>
  )
}

interface ModeButtonProps {
  active: boolean
  children: string
  onClick: () => void
}

function ModeButton({ active, children, onClick }: ModeButtonProps) {
  return (
    <button
      className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
        active ? 'bg-white text-[#1f1f1f] shadow-sm' : 'text-[#6f7377]'
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}
