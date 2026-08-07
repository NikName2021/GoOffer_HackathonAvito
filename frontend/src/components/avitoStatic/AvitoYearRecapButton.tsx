import { LoaderCircle } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import recapLogo from '@/assets/avitoNotBackground.svg'
import { RecapDialog } from '@/components/recap/RecapDialog'
import { DialogTrigger } from '@/components/ui/dialog'
import { PATHS } from '@/config/paths'
import { useProfileDetails } from '@/hooks/useProfiles'

export function AvitoYearRecapButton() {
  const [searchParams] = useSearchParams()
  const profileId = searchParams.get('profileId') ?? undefined
  const profileQuery = useProfileDetails(profileId)

  if (profileQuery.data) {
    return (
      <RecapDialog profile={profileQuery.data}>
        <DialogTrigger aria-label={`Открыть итоги года для ${profileQuery.data.name}`} className="avito-static-recap-link">
          <img alt="" aria-hidden="true" src={recapLogo} />
          <span>
            <strong>Итоги года</strong>
            <small>{profileQuery.data.name}</small>
          </span>
        </DialogTrigger>
      </RecapDialog>
    )
  }

  if (profileQuery.isPending && profileId) {
    return (
      <button className="avito-static-recap-link" disabled type="button">
        <LoaderCircle aria-hidden="true" className="avito-static-recap-loader" />
        <span><strong>Итоги года</strong><small>Загружаем профиль…</small></span>
      </button>
    )
  }

  return (
    <Link aria-label="Перейти к итогам года" className="avito-static-recap-link" to={PATHS.HOME}>
      <img alt="" aria-hidden="true" src={recapLogo} />
      <span>
        <strong>Итоги года</strong>
        <small>{profileQuery.isError ? 'Профиль недоступен' : 'Выберите профиль'}</small>
      </span>
    </Link>
  )
}
