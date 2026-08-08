import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CategoryChart } from './CategoryChart'

describe('CategoryChart', () => {
  it('ничего не ломает при пустом списке', () => {
    const { container } = render(<CategoryChart categories={[]} />)
    expect(container).toBeTruthy()
  })

  it('показывает названия категорий и счётчики', () => {
    render(
      <CategoryChart
        categories={[
          { category: 'Электроника', count: 100 },
          { category: 'Авто', count: 40 },
        ]}
      />,
    )
    expect(screen.getByText(/Электроника/)).toBeInTheDocument()
    expect(screen.getByText(/Авто/)).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('40')).toBeInTheDocument()
  })
})