import { Plus } from 'lucide-react'

interface AddProfileButtonProps {
  onClick: () => void
}

export function AddProfileButton({ onClick }: AddProfileButtonProps) {
  return (
    <button
      className="group flex min-h-[360px] cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#dfe1e3] bg-transparent p-6 text-center transition hover:border-[#00aaff] hover:bg-[#f7fcff] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#00aaff]"
      onClick={onClick}
      type="button"
    >
      <span className="grid size-14 place-items-center rounded-full bg-[#e8f6ff] text-[#00aaff] transition group-hover:scale-105">
        <Plus aria-hidden="true" className="size-7" strokeWidth={2.2} />
      </span>
      <span className="mt-4 text-sm font-semibold text-[#1f1f1f]">Добавить профиль</span>
      <span className="mt-1 text-xs text-[#8a8d91]">Создать итоги года</span>
    </button>
  )
}
