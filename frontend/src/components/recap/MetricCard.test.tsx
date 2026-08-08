import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricCard } from './MetricCard'

describe('MetricCard', () => {
  it('рендерит label и value', () => {
    render(<MetricCard label="Просмотры" value={620} />)
    expect(screen.getByText('Просмотры')).toBeInTheDocument()
    expect(screen.getByText(/620/)).toBeInTheDocument()
  })
})