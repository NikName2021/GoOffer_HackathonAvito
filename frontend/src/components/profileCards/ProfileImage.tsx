import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import type { GetProfileResponse } from '@/types/profileResponse.type'
import { getProfileAccent, getProfileInitials } from '@/utils/profileAppearance'

interface ProfileImageProps {
  profile: GetProfileResponse
  size?: 'default' | 'large' | 'small'
}

export function ProfileImage({ profile, size = 'default' }: ProfileImageProps) {
  const sizeClass = size === 'large' ? 'size-16' : size === 'small' ? 'size-11' : 'size-14'

  return (
    <span
      className={`relative grid ${sizeClass} shrink-0 place-items-center overflow-hidden rounded-full text-sm font-bold text-white`}
      style={{ backgroundColor: getProfileAccent(profile.name) }}
    >
      <span>{getProfileInitials(profile.name)}</span>
      {profile.avatarUrl && (
        <ImageWithFallback
          alt={`Фото пользователя ${profile.name}`}
          className="absolute inset-0 size-full object-cover"
          src={profile.avatarUrl}
        />
      )}
    </span>
  )
}
