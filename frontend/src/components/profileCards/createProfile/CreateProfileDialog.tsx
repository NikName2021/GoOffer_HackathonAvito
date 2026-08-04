import { Eye, Megaphone, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { OwnAdsFormSection } from './OwnAdsFormSection'
import { ProfileFormSection } from './ProfileFormSection'
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
  onCreate: (profile: CreateProfileRequest) => void
  onOpenChange: (open: boolean) => void
  open: boolean
}

const sections = [
  { id: 'profile', icon: UserRound, label: 'Профиль' },
  { id: 'ads', icon: Megaphone, label: 'Объявления' },
  { id: 'views', icon: Eye, label: 'Просмотры' },
] as const

export function CreateProfileDialog({ onCreate, onOpenChange, open }: CreateProfileDialogProps) {
  const [activeSection, setActiveSection] = useState<CreateProfileSection>('profile')
  const [error, setError] = useState('')
  const form = useCreateProfileForm()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateCreateProfile(form.profile)

    if (validationError) {
      setActiveSection(validationError.section)
      setError(validationError.message)
      return
    }

    onCreate(form.profile)
    form.reset()
    setActiveSection('profile')
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="grid max-h-[calc(100dvh-2rem)] grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-4 overflow-hidden rounded-[28px] p-5 sm:max-w-4xl sm:p-6">
        <DialogHeader className="pr-10">
          <DialogTitle className="text-xl font-bold text-[#1f1f1f]">Новый профиль</DialogTitle>
          <DialogDescription className="text-xs text-[#8a8d91]">
            Заполните данные для создания персональных итогов года.
          </DialogDescription>
        </DialogHeader>

        <form className="contents" noValidate onSubmit={handleSubmit}>
          <nav aria-label="Разделы формы" className="grid grid-cols-3 gap-1 rounded-2xl bg-[#f2f3f5] p-1">
            {sections.map(({ id, icon: Icon, label }) => {
              const count = id === 'ads' ? form.profile.ownAds.length : id === 'views' ? form.profile.views.length : null
              const isActive = activeSection === id

              return (
                <button
                  aria-current={isActive ? 'step' : undefined}
                  className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition ${
                    isActive ? 'bg-white text-[#1f1f1f] shadow-sm' : 'text-[#6f7377] hover:text-[#1f1f1f]'
                  }`}
                  key={id}
                  onClick={() => {
                    setActiveSection(id)
                    setError('')
                  }}
                  type="button"
                >
                  <Icon aria-hidden="true" className={`size-4 ${isActive ? 'text-[#00aaff]' : ''}`} />
                  <span className="truncate">{label}</span>
                  {count !== null && count > 0 && (
                    <span className="rounded-full bg-[#e8f6ff] px-1.5 text-[10px] text-[#00aaff]">{count}</span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="min-h-0 overflow-y-auto px-1 py-1">
            {activeSection === 'profile' && (
              <ProfileFormSection onChange={form.updateProfile} profile={form.profile} />
            )}
            {activeSection === 'ads' && (
              <OwnAdsFormSection
                ads={form.profile.ownAds}
                onAdd={form.addOwnAd}
                onChange={form.updateOwnAd}
                onRemove={form.removeOwnAd}
              />
            )}
            {activeSection === 'views' && (
              <ViewsFormSection
                onAdd={form.addView}
                onChange={form.updateView}
                onRemove={form.removeView}
                views={form.profile.views}
              />
            )}
          </div>

          <DialogFooter className="items-center border-t border-[#eceeef] pt-4 sm:justify-between">
            <p aria-live="polite" className="mr-auto text-xs text-[#ff4053]">
              {error}
            </p>
            <Button onClick={() => onOpenChange(false)} type="button" variant="ghost">
              Отмена
            </Button>
            <Button className="bg-[#00aaff] px-5 text-white hover:bg-[#0099e6]" type="submit">
              Создать карточку
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
