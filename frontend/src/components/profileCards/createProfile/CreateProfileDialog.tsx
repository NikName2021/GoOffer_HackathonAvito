import { useState, type FormEvent } from 'react'

import { OwnAdsFormSection } from './OwnAdsFormSection'
import { ProfileFormSection } from './ProfileFormSection'
import { ProfileFormTabs } from './ProfileFormTabs'
import { useCreateProfileForm } from './useCreateProfileForm'
import { validateCreateProfile, type CreateProfileSection } from './validateCreateProfile'
import { ViewsFormSection } from './ViewsFormSection'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { CreateProfileRequest } from '@/types/profileRequest.type'

interface CreateProfileDialogProps {
  initialProfile?: CreateProfileRequest
  mode?: 'create' | 'edit'
  onOpenChange: (open: boolean) => void
  onSubmit: (profile: CreateProfileRequest) => Promise<void>
  open: boolean
}

export function CreateProfileDialog({ initialProfile, mode = 'create', onOpenChange, onSubmit, open }: CreateProfileDialogProps) {
  const [activeSection, setActiveSection] = useState<CreateProfileSection>('profile')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useCreateProfileForm(initialProfile)
  const isEditing = mode === 'edit'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateCreateProfile(form.profile)

    if (validationError) {
      setActiveSection(validationError.section)
      setError(validationError.message)
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      await onSubmit(form.profile)
      form.reset()
      setActiveSection('profile')
      onOpenChange(false)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Не удалось сохранить профиль.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="grid max-h-[calc(100dvh-2rem)] grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-4 overflow-hidden rounded-[28px] p-5 sm:max-w-4xl sm:p-6">
        <DialogHeader className="pr-10">
          <DialogTitle className="text-xl font-bold text-[#1f1f1f]">
            {isEditing ? 'Редактирование профиля' : 'Новый профиль'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#8a8d91]">
            Заполните данные профиля, объявлений и просмотров.
          </DialogDescription>
        </DialogHeader>

        <form className="contents" noValidate onSubmit={handleSubmit}>
          <ProfileFormTabs
            activeSection={activeSection}
            onChange={(section) => {
              setActiveSection(section)
              setError('')
            }}
            profile={form.profile}
          />

          <div className="min-h-0 overflow-y-auto px-1 py-1">
            {activeSection === 'profile' && <ProfileFormSection onChange={form.updateProfile} profile={form.profile} />}
            {activeSection === 'ads' && (
              <OwnAdsFormSection
                ads={form.profile.ownAds}
                onAdd={form.addOwnAd}
                onChange={form.updateOwnAd}
                onImport={form.importOwnAds}
                onRemove={form.removeOwnAd}
              />
            )}
            {activeSection === 'views' && (
              <ViewsFormSection
                onAdd={form.addView}
                onChange={form.updateView}
                onImport={form.importViews}
                onRemove={form.removeView}
                views={form.profile.views}
              />
            )}
          </div>

          <DialogFooter className="items-center border-t border-[#eceeef] pt-4 sm:justify-between">
            <p aria-live="polite" className="mr-auto text-xs text-[#ff4053]">{error}</p>
            <Button disabled={isSubmitting} onClick={() => onOpenChange(false)} type="button" variant="ghost">Отмена</Button>
            <Button className="bg-[#00aaff] px-5 text-white hover:bg-[#0099e6]" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Сохраняем…' : isEditing ? 'Сохранить изменения' : 'Создать карточку'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
