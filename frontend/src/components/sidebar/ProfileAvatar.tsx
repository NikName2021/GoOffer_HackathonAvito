import { UserIcon } from 'lucide-react'

interface ProfileAvatarProps {
  name: string
  onClick: () => void
  isAuth: boolean
}

export function ProfileAvatar({ name, onClick, isAuth }: ProfileAvatarProps) {
  const initial = isAuth ? name.slice(0, 1).toUpperCase() || '?' : <UserIcon aria-hidden="true" className="size-6" />

  return (
    <button
      aria-label={`Профиль: ${name}`}
      className="flex w-full cursor-pointer items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#00aaff]"
      onClick={onClick}
      type="button"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#00aaff] text-sm font-bold text-white">
        {initial}
      </span>
      <span className="hidden min-w-0 lg:block">
        <span className="block truncate text-sm font-semibold text-[#1f1f1f]">{name}</span>
        <span className="block text-xs text-[#8a8d91]">{isAuth ? 'Аккаунт' : 'Авторизация'}</span>
      </span>
    </button>
  )
}
