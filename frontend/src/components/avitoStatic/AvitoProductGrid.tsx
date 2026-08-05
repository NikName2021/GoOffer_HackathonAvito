import { Heart, MoreHorizontal } from 'lucide-react'

import { AVITO_PRODUCTS } from '@/constants/avitoStatic'

export function AvitoProductGrid() {
  return (
    <section className="avito-static-products">
      {AVITO_PRODUCTS.map((product, index) => (
        <article className="avito-static-product" key={`${product.title}-${index}`}>
          <img alt={product.title} src={product.image} />
          <span className="avito-static-favorite"><Heart /></span>
          <h2>{product.title}</h2>
          <MoreHorizontal className="avito-static-more" />
          <strong>{product.price}</strong>
        </article>
      ))}
    </section>
  )
}
