interface ProfileAvatarProps {
  name: string
  subtitle?: string
}

export function ProfileAvatar({ name, subtitle = 'Профиль' }: ProfileAvatarProps) {
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase()

  return (
    <div
      aria-label={`Профиль: ${name}`}
      className="flex items-center gap-3 rounded-2xl p-2 text-left"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#00aaff] text-sm font-bold text-white">
        {initial}
      </span>
      <span className="hidden min-w-0 lg:block">
        <span className="block truncate text-sm font-semibold text-[#1f1f1f]">{name}</span>
        <span className="block text-xs text-[#8a8d91]">{subtitle}</span>
      </span>
    </div>
  )
}