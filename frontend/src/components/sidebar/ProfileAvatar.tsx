interface ProfileAvatarProps {
  name: string
  onClick: () => void
  subtitle: string
}

export function ProfileAvatar({ name, onClick, subtitle }: ProfileAvatarProps) {
  const initial = name.slice(0, 1).toUpperCase() || '?'

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
        <span className="block text-xs text-[#8a8d91]">{subtitle}</span>
      </span>
    </button>
  )
}
