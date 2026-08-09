import '@/components/avitoStatic/avitoStatic.css'

import { ChevronUp } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { AvitoBusiness } from '@/components/avitoStatic/AvitoBusiness'
import { AvitoCategories } from '@/components/avitoStatic/AvitoCategories'
import { AvitoDestinationContent } from '@/components/avitoStatic/destinations/AvitoDestinationContent'
import { AvitoFooter } from '@/components/avitoStatic/AvitoFooter'
import { AvitoHeader } from '@/components/avitoStatic/AvitoHeader'
import { AvitoProductGrid } from '@/components/avitoStatic/AvitoProductGrid'
import { AvitoPromo } from '@/components/avitoStatic/AvitoPromo'
import { AvitoSearch } from '@/components/avitoStatic/AvitoSearch'
import { AvitoYearRecapButton } from '@/components/avitoStatic/AvitoYearRecapButton'
import { PATHS } from '@/config/paths'

export function AvitoPage() {
  const { pathname } = useLocation()
  const isHomepage = pathname === PATHS.AVITO || pathname === `${PATHS.AVITO}/`

  return (
    <div className="avito-static-page">
      <AvitoHeader />
      <main className="avito-static-container">
        <AvitoSearch />
        {isHomepage ? (
          <>
            <div className="avito-static-catalog-layout">
              <div>
                <AvitoCategories />
                <AvitoPromo />
              </div>
              <AvitoBusiness />
            </div>
            <AvitoProductGrid />
          </>
        ) : (
          <AvitoDestinationContent />
        )}
      </main>
      <AvitoFooter />
      <AvitoYearRecapButton />
      <div className="avito-static-messages">Сообщения <ChevronUp /></div>
    </div>
  )
}
