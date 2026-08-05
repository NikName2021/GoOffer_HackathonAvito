import { Heart, Settings } from 'lucide-react'
import { useState } from 'react'

import favicon from '@/assets/avitoNotBackground.svg'
import { AuthDialog } from '@/components/auth/AuthDialog'
import { useAppSelector } from '@/store/hooks'
import { ProfileAvatar } from './ProfileAvatar'

const sidebarItems = [
  { label: 'Избранное', icon: Heart },
  { label: 'Настройки', icon: Settings },
] as const

export function Sidebar() {
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const account = useAppSelector((state) => state.auth.account)
  const displayName = account?.login ?? 'Войти'

  return (
    <>
      <aside className="sticky top-0 flex h-dvh w-[82px] shrink-0 flex-col border-r border-[#e6e7e8] bg-[#f5f5f5] px-3 py-6 lg:w-[236px] lg:px-5">
        <div className="flex items-center gap-3 px-2">
          <img src={favicon} alt="Логотип" className="size-7" />
          <span className="hidden text-base font-bold tracking-tight text-[#1f1f1f] lg:block">Итоги года</span>
        </div>

        <nav aria-label="Боковая навигация" className="mt-12 space-y-2">
          {sidebarItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className="flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl px-3 py-3 text-[#6f7377] lg:justify-start"
              disabled
              type="button"
            >
              <Icon aria-hidden="true" className="size-5" strokeWidth={1.8} />
              <span className="hidden text-sm font-medium lg:block">{label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          <ProfileAvatar
            name={displayName}
            onClick={() => setIsAuthOpen(true)}
            isAuth={!!account}
          />
        </div>
      </aside>

      <AuthDialog onOpenChange={setIsAuthOpen} open={isAuthOpen} />
    </>
  )
}
