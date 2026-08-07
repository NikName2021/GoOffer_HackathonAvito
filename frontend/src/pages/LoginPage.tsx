import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLogin, useRegister } from '@/hooks/useAuth'
import { PATHS } from '@/config/paths'

export function LoginPage() {
  const navigate = useNavigate()
  const loginMut = useLogin()
  const registerMut = useRegister()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loginName, setLoginName] = useState('demo')
  const [password, setPassword] = useState('demo123')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      if (mode === 'login') {
        await loginMut.mutateAsync({ login: loginName, password })
      } else {
        await registerMut.mutateAsync({ login: loginName, password })
      }
      navigate(PATHS.HOME)
    } catch {
      setError(
        mode === 'login'
          ? 'Неверный логин или пароль'
          : 'Не удалось зарегистрироваться (логин занят или короткий пароль)',
      )
    }
  }

  const pending = loginMut.isPending || registerMut.isPending

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f7f8fa] px-5">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl border border-[#e7e9eb] bg-white p-8 shadow-sm"
      >
        <h1 className="text-2xl font-bold text-[#1f1f1f]">
          {mode === 'login' ? 'Вход' : 'Регистрация'}
        </h1>
        <p className="mt-2 text-sm text-[#6f7377]">
          Демо: <code className="rounded bg-[#f3f4f6] px-1">demo</code> /{' '}
          <code className="rounded bg-[#f3f4f6] px-1">demo123</code>
        </p>

        <div className="mt-4 flex gap-2 rounded-xl bg-[#f3f4f6] p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
              mode === 'login' ? 'bg-white text-[#1f1f1f] shadow-sm' : 'text-[#6f7377]'
            }`}
          >
            Войти
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
              mode === 'register' ? 'bg-white text-[#1f1f1f] shadow-sm' : 'text-[#6f7377]'
            }`}
          >
            Регистрация
          </button>
        </div>

        <label className="mt-6 block text-sm font-medium">Логин</label>
        <input
          className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2.5 text-sm outline-none focus:border-[#00aaff]"
          value={loginName}
          onChange={(e) => setLoginName(e.target.value)}
          autoComplete="username"
        />

        <label className="mt-4 block text-sm font-medium">Пароль</label>
        <input
          type="password"
          className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2.5 text-sm outline-none focus:border-[#00aaff]"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-xl bg-[#00aaff] py-3 text-sm font-semibold text-white hover:bg-[#0090dd] disabled:opacity-60"
        >
          {pending ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
        </button>

        <Link
          to={PATHS.HOME}
          className="mt-4 block text-center text-sm text-[#6f7377] hover:text-[#00aaff]"
        >
          Продолжить без входа →
        </Link>
      </form>
    </div>
  )
}