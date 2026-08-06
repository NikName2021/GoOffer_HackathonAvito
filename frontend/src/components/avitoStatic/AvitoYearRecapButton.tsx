import { Link } from 'react-router-dom'

import recapLogo from '@/assets/avitoNotBackground.svg'
import { PATHS } from '@/config/paths'

export function AvitoYearRecapButton() {
  return (
    <Link aria-label="Перейти к итогам года" className="avito-static-recap-link" to={PATHS.HOME}>
      <img alt="" aria-hidden="true" src={recapLogo} />
      <span>
        <strong>Итоги года</strong>
        <small>Вернуться к профилям</small>
      </span>
    </Link>
  )
}
