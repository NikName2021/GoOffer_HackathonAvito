import { MapPin, Search } from 'lucide-react'

import { AvitoLogo } from './AvitoLogo'

export function AvitoSearch() {
  return (
    <section className="avito-static-search-row">
      <AvitoLogo />
      <div className="avito-static-search">
        <span className="avito-static-category-button">⠿ Все категории</span>
        <span className="avito-static-search-input"><Search /> Поиск по объявлениям</span>
        <span className="avito-static-find">Найти</span>
      </div>
      <span className="avito-static-location"><MapPin /> Краснодар</span>
    </section>
  )
}
