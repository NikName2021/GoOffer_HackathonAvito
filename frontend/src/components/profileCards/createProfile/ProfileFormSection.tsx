import { FormField } from './FormControls'
import { ImageUploadField } from './ImageUploadField'
import type { CreateProfileRequest } from '@/types/profileRequest.type'

type ProfileFields = Pick<CreateProfileRequest, 'name' | 'joinedAt' | 'avatarUrl' | 'likes' | 'chatsCount'>

interface ProfileFormSectionProps {
  onChange: (patch: Partial<ProfileFields>) => void
  profile: ProfileFields
}

export function ProfileFormSection({ onChange, profile }: ProfileFormSectionProps) {
  return (
    <section>
      <div className="mb-5">
        <h3 className="text-lg font-bold text-[#1f1f1f]">Данные профиля</h3>
        <p className="mt-1 text-xs text-[#8a8d91]">Основная информация для новой карточки итогов.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Имя пользователя"
          onChange={(event) => onChange({ name: event.target.value })}
          placeholder="Анна Смирнова"
          required
          value={profile.name}
        />
        <FormField
          label="Дата регистрации на Авито"
          onChange={(event) => onChange({ joinedAt: event.target.value })}
          required
          type="date"
          value={profile.joinedAt}
        />
        <FormField
          label="Количество лайков"
          min="0"
          onChange={(event) => onChange({ likes: event.target.valueAsNumber || 0 })}
          type="number"
          value={profile.likes}
        />
        <FormField
          label="Количество чатов"
          min="0"
          onChange={(event) => onChange({ chatsCount: event.target.valueAsNumber || 0 })}
          type="number"
          value={profile.chatsCount}
        />
      </div>

      <div className="mt-4">
        <ImageUploadField
          label="Фотография профиля"
          onChange={(avatarUrl) => onChange({ avatarUrl })}
          value={profile.avatarUrl}
        />
      </div>
    </section>
  )
}
