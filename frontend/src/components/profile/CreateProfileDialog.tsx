import { useState } from 'react'
import { useCreateProfile } from '@/hooks/useCreateProfile'
import { RECAP_YEAR } from '@/constants/backendProfiles'

const PROFILE_TYPES: { value: string; label: string; hint: string }[] = [
  { value: 'seller', label: 'Продавец', hint: 'Много продаж и просмотров' },
  { value: 'buyer', label: 'Покупатель', hint: 'Просмотры, избранное, покупки' },
  { value: 'veteran', label: 'Ветеран', hint: 'Высокая активность почти каждый день' },
  { value: 'newbie', label: 'Новичок', hint: 'Мало действий — тихий год' },
  { value: 'universal', label: 'Универсал', hint: 'И покупки, и продажи' },
]

type Props = {
  open: boolean
  onClose: () => void
}

export function CreateProfileDialog({ open, onClose }: Props) {
  const create = useCreateProfile()
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [profileType, setProfileType] = useState('universal')
  const [formError, setFormError] = useState<string | null>(null)

  if (!open) return null

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setFormError('Укажите имя профиля')
      return
    }
    try {
      await create.mutateAsync({
        name: trimmed,
        profile_type: profileType,
        year: RECAP_YEAR,
        avatar: avatar.trim() || undefined,
      })
      setName('')
      setAvatar('')
      setProfileType('universal')
      onClose()
    } catch {
      setFormError('Не удалось создать профиль. Войдите в аккаунт и попробуйте снова.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-profile-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !create.isPending) onClose()
      }}
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-xl"
      >
        <h2 id="create-profile-title" className="text-xl font-bold tracking-tight text-[#1f1f1f]">
          Новый профиль
        </h2>
        <p className="mt-2 text-sm text-[#6f7377]">
          Создайте тестовый профиль — к нему сгенерируется демо-активность за {RECAP_YEAR} год, чтобы
          сразу можно было открыть «Итоги».
        </p>

        <label className="mt-5 block text-sm font-medium text-[#1f1f1f]">
          Имя
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, Анна Смирнова"
            maxLength={80}
            className="mt-1.5 w-full rounded-xl border border-[#e5e7eb] px-3 py-2.5 text-sm outline-none focus:border-[#00aaff] focus:ring-2 focus:ring-[#00aaff]/20"
            autoFocus
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-[#1f1f1f]">
          Фото (ссылка, необязательно)
          <input
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://... или оставьте пустым"
            className="mt-1.5 w-full rounded-xl border border-[#e5e7eb] px-3 py-2.5 text-sm outline-none focus:border-[#00aaff] focus:ring-2 focus:ring-[#00aaff]/20"
          />
          <span className="mt-1 block text-xs text-[#6f7377]">
            Если не указать — сгенерируем цветной аватар без фото людей
          </span>
        </label>

        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-[#1f1f1f]">Тип поведения</legend>
          <div className="mt-2 space-y-2">
            {PROFILE_TYPES.map((t) => (
              <label
                key={t.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                  profileType === t.value
                    ? 'border-[#00aaff] bg-[#f0f9ff] ring-1 ring-[#00aaff]/30'
                    : 'border-[#e5e7eb] hover:bg-[#f7f8fa]'
                }`}
              >
                <input
                  type="radio"
                  name="profile_type"
                  value={t.value}
                  checked={profileType === t.value}
                  onChange={() => setProfileType(t.value)}
                  className="mt-1"
                />
                <span>
                  <span className="font-semibold text-[#1f1f1f]">{t.label}</span>
                  <span className="mt-0.5 block text-xs text-[#6f7377]">{t.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {formError && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {formError}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={create.isPending}
            className="rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-sm font-semibold text-[#1f1f1f] hover:bg-[#f7f8fa] disabled:opacity-60"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-xl bg-[#00aaff] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0090dd] disabled:opacity-60"
          >
            {create.isPending ? 'Создаём…' : 'Создать'}
          </button>
        </div>
      </form>
    </div>
  )
}