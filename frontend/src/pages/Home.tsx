import { useState } from 'react'

import { AddProfileButton } from '@/components/profileCards/AddProfileButton'
import { CreateProfileDialog } from '@/components/profileCards/createProfile/CreateProfileDialog'
import { DeleteProfileDialog } from '@/components/profileCards/DeleteProfileDialog'
import { ProfileCard } from '@/components/profileCards/ProfileCard'
import { Sidebar } from '@/components/sidebar/Sidebar'
import {
  useCreateProfile,
  useDeleteProfile,
  useProfileDetails,
  useProfiles,
  useUpdateProfile,
} from '@/hooks/useProfiles'
import { useAppSelector } from '@/store/hooks'
import type { CreateProfileRequest } from '@/types/profileRequest.type'
import type { GetProfileDetailsResponse, GetProfileResponse } from '@/types/profileResponse.type'

export function HomePage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)
  const [profileToDelete, setProfileToDelete] = useState<GetProfileResponse | null>(null)
  const account = useAppSelector((state) => state.auth.account)
  const profilesQuery = useProfiles(account?.id)
  const editingProfileQuery = useProfileDetails(editingProfileId ?? undefined)
  const createProfileMutation = useCreateProfile(account?.id)
  const updateProfileMutation = useUpdateProfile(account?.id)
  const deleteProfileMutation = useDeleteProfile(account?.id)
  const profiles = profilesQuery.data ?? []
  const editingProfile = editingProfileQuery.data

  async function handleProfileSubmit(profile: CreateProfileRequest) {
    if (editingProfileId) {
      await updateProfileMutation.mutateAsync({ id: editingProfileId, profile })
      return
    }
    await createProfileMutation.mutateAsync(profile)
  }

  function closeProfileForm(open: boolean) {
    if (!open) {
      setIsCreateDialogOpen(false)
      setEditingProfileId(null)
    }
  }

  return (
    <div className="flex min-h-dvh bg-white text-[#1f1f1f]">
      <Sidebar />

      <main className="min-w-0 flex-1 px-5 py-10 sm:px-8 lg:px-12 lg:py-14 xl:px-16">
        <div className="mx-auto max-w-[1120px]">
          <header>
            <p className="text-sm font-semibold text-[#00aaff]">Авито · 2026</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-[#1f1f1f] sm:text-4xl">Чьи итоги посмотрим?</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#6f7377] sm:text-base">
              Выберите тестовый профиль, чтобы собрать персональную историю года на основе его активности.
            </p>
          </header>

          <section aria-label="Тестовые профили" className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {!account && <ProfilesNotice text="Войдите в аккаунт через профиль в левом нижнем углу." />}
            {account && profilesQuery.isPending && <ProfilesNotice text="Загружаем профили…" />}
            {account && profilesQuery.isError && (
              <ProfilesNotice actionLabel="Повторить" onAction={() => void profilesQuery.refetch()} text={profilesQuery.error.message} />
            )}
            {editingProfileQuery.isError && (
              <ProfilesNotice actionLabel="Повторить" onAction={() => void editingProfileQuery.refetch()} text={editingProfileQuery.error.message} />
            )}
            {account && profilesQuery.isSuccess && (
              <>
                {profiles.map((profile) => (
                  <ProfileCard key={profile.id} onDelete={setProfileToDelete} onEdit={setEditingProfileId} profile={profile} />
                ))}
                <AddProfileButton onClick={() => setIsCreateDialogOpen(true)} />
              </>
            )}
          </section>
        </div>
      </main>

      <CreateProfileDialog
        initialProfile={editingProfile ? toProfileRequest(editingProfile) : undefined}
        key={editingProfile?.id ?? (isCreateDialogOpen ? 'create' : 'closed')}
        mode={editingProfile ? 'edit' : 'create'}
        onOpenChange={closeProfileForm}
        onSubmit={handleProfileSubmit}
        open={isCreateDialogOpen || Boolean(editingProfile)}
      />
      <DeleteProfileDialog
        error={deleteProfileMutation.error instanceof Error ? deleteProfileMutation.error.message : undefined}
        isDeleting={deleteProfileMutation.isPending}
        onConfirm={async () => {
          if (profileToDelete) await deleteProfileMutation.mutateAsync(profileToDelete.id)
        }}
        onOpenChange={(open) => !open && setProfileToDelete(null)}
        profile={profileToDelete}
      />
    </div>
  )
}

function toProfileRequest(profile: GetProfileDetailsResponse): CreateProfileRequest {
  return {
    avatarUrl: profile.avatarUrl,
    chatsCount: profile.stats.chatsCount,
    joinedAt: profile.joinedAt,
    likes: profile.stats.likes,
    name: profile.name,
    ownAds: profile.ownAds,
    views: profile.views,
  }
}

interface ProfilesNoticeProps {
  actionLabel?: string
  onAction?: () => void
  text: string
}

function ProfilesNotice({ actionLabel, onAction, text }: ProfilesNoticeProps) {
  return (
    <div className="col-span-full rounded-3xl border border-[#e7e9eb] bg-[#f7fcff] px-6 py-8 text-center">
      <p className="text-sm text-[#6f7377]">{text}</p>
      {actionLabel && onAction && (
        <button className="mt-3 text-sm font-semibold text-[#00aaff] hover:text-[#0099e6]" onClick={onAction} type="button">
          {actionLabel}
        </button>
      )}
    </div>
  )
}
