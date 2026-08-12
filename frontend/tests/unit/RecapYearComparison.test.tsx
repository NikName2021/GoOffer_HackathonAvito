import { render, screen } from '@testing-library/react'

import { RecapYearComparison } from '@/components/recap/RecapYearComparison'
import type { RecapResponse } from '@/types/recap.type'

const baseRecap = {
  comparison: {
    categories: [],
    current_year: 2026,
    message: 'Данные сравнения готовы.',
    new_interests: [],
    previous_year: 2025,
    sales_revenue: { absolute_change: 200, current: 500, percent_change: null, previous: 0 },
    spending: { absolute_change: 100, current: 400, percent_change: 33, previous: 300 },
    status: 'available',
  },
  forecast: {
    likely_categories: [],
    method: 'linear_year_over_year',
    sales_revenue: { expected: 700, max: 900, min: 500 },
    spending: { expected: 500, max: 600, min: 400 },
    year: 2027,
  },
} as RecapResponse

describe('RecapYearComparison', () => {
  it('uses backend comparison values without requesting a previous recap', () => {
    render(<RecapYearComparison recap={baseRecap} />)
    expect(screen.getByText('Сравнение с 2025 годом')).toBeInTheDocument()
  })

  it('shows first-year copy without treating categories as new', async () => {
    const recap = { ...baseRecap, comparison: { ...baseRecap.comparison!, status: 'first_year' as const } }
    render(<RecapYearComparison recap={recap} />)
    await screen.getByText('Первые итоги и прогноз').click()
    expect(screen.getByText('Это ваши первые итоги года')).toBeInTheDocument()
    expect(screen.queryByText(/Новый интерес/)).not.toBeInTheDocument()
  })

  it('shows message instead of charts when comparison is unavailable', () => {
    const recap = { ...baseRecap, comparison: { ...baseRecap.comparison!, message: 'Повторите генерацию.', status: 'unavailable' as const } }
    render(<RecapYearComparison recap={recap} />)
    expect(screen.getByText('Повторите генерацию.')).toBeInTheDocument()
    expect(screen.queryByText('Сравнение с 2025 годом')).not.toBeInTheDocument()
  })
})
