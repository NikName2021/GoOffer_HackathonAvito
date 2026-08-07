import '@/components/avitoStatic/avitoStatic.css'

import { ChevronUp } from 'lucide-react'

import { AvitoBusiness } from '@/components/avitoStatic/AvitoBusiness'
import { AvitoCategories } from '@/components/avitoStatic/AvitoCategories'
import { AvitoFooter } from '@/components/avitoStatic/AvitoFooter'
import { AvitoHeader } from '@/components/avitoStatic/AvitoHeader'
import { AvitoProductGrid } from '@/components/avitoStatic/AvitoProductGrid'
import { AvitoPromo } from '@/components/avitoStatic/AvitoPromo'
import { AvitoSearch } from '@/components/avitoStatic/AvitoSearch'
import { AvitoYearRecapButton } from '@/components/avitoStatic/AvitoYearRecapButton'

export function AvitoPage() {
  return (
    <div className="avito-static-page">
      <AvitoHeader />
      <main className="avito-static-container">
        <AvitoSearch />
        <div className="avito-static-catalog-layout">
          <div>
            <AvitoCategories />
            <AvitoPromo />
          </div>
          <AvitoBusiness />
        </div>
        <AvitoProductGrid />
      </main>
      <AvitoFooter />
      <AvitoYearRecapButton />
      <div className="avito-static-messages">Сообщения <ChevronUp /></div>
    </div>
  )
}
