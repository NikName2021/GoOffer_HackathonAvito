import { AVITO_CATEGORIES } from '@/constants/avitoStatic'

export function AvitoCategories() {
  return (
    <div className="avito-static-categories">
      {AVITO_CATEGORIES.map((category) => (
        <article className="avito-static-category" key={category.label}>
          <span>{category.label}</span>
          <img alt={category.label} src={category.image} />
        </article>
      ))}
    </div>
  )
}
