import { describe, expect, it } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react'

import { ImageWithFallback } from '@/components/ui/image-with-fallback'

describe('ImageWithFallback', () => {
  it('replaces an unavailable image with the local fallback', () => {
    render(
      <ImageWithFallback
        alt="Товар"
        fallbackSrc="/assets/product-fallback.webp"
        src="https://img.example.test/unavailable.jpg"
      />,
    )

    fireEvent.error(screen.getByRole('img', { name: 'Товар' }))

    expect(screen.getByRole('img', { name: 'Товар' })).toHaveAttribute(
      'src',
      '/assets/product-fallback.webp',
    )
  })

  it('removes a broken image when no fallback is configured', () => {
    render(<ImageWithFallback alt="Аватар" src="https://img.example.test/unavailable.jpg" />)

    fireEvent.error(screen.getByRole('img', { name: 'Аватар' }))

    expect(screen.queryByRole('img', { name: 'Аватар' })).not.toBeInTheDocument()
  })
})
