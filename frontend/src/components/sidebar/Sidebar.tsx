import { Home, LogIn, LogOut } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import favicon from '@/assets/avitoNotBackground.svg'
import { ProfileAvatar } from './ProfileAvatar'
import { useMe, useLogout } from '@/hooks/useAuth'
import { PATHS } from '@/config/paths'

export function Sidebar() {
  const { data: me, isLoading } = useMe()
  const logoutMut = useLogout()
  const location = useLocation()

  const displayName = me?.login ?? (isLoading ? '…' : 'Гость')
  const subtitle = me ? 'Вы вошли' : 'Без входа'
  const onHome = location.pathname === PATHS.HOME

  return (
    <aside className="sticky top-0 flex h-dvh w-[82px] shrink-0 flex-col border-r border-[#e6e7e8] bg-[#f5f5f5] px-3 py-6 lg:w-[236px] lg:px-5">
      <Link to={PATHS.HOME} className="flex items-center gap-3 px-2">
        <img src={favicon} alt="Логотип" className="size-7" />
        <span className="hidden text-base font-bold tracking-tight text-[#1f1f1f] lg:block">
          Итоги года
        </span>
      </Link>

      <nav aria-label="Боковая навигация" className="mt-12 space-y-2">
        <Link
          to={PATHS.HOME}
          className={`flex w-full items-center justify-center gap-3 rounded-xl px-3 py-3 lg:justify-start ${
            onHome
              ? 'bg-white font-semibold text-[#1f1f1f] shadow-sm'
              : 'text-[#6f7377] hover:bg-[#ebebeb]'
          }`}
        >
          <Home className="size-5" strokeWidth={1.8} />
          <span className="hidden text-sm font-medium lg:block">Профили</span>
        </Link>
      </nav>

      <div className="mt-auto space-y-2">
        <ProfileAvatar name={displayName} subtitle={subtitle} />

        {me ? (
          <button
            type="button"
            onClick={() => logoutMut.mutate()}
            disabled={logoutMut.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-[#6f7377] hover:bg-[#ebebeb] lg:justify-start"
          >
            <LogOut className="size-4" />
            <span className="hidden lg:inline">
              {logoutMut.isPending ? 'Выходим…' : 'Выйти'}
            </span>
          </button>
        ) : (
          <Link
            to={PATHS.LOGIN}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#00aaff] hover:bg-[#e8f6ff] lg:justify-start"
          >
            <LogIn className="size-4" />
            <span className="hidden lg:inline">Войти</span>
          </Link>
        )}
      </div>
    </aside>
  )
}