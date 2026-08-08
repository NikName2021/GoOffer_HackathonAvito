import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StrictMode, type ReactNode } from 'react'

import { sendRecapEvent } from '@/api/recapEvents'
import { RecapViewer } from '@/components/recap/RecapViewer'
import type { GetProfileResponse } from '@/types/profileResponse.type'
import type { RecapResponse } from '@/types/recap.type'

jest.mock('@/api/recapEvents', () => ({ sendRecapEvent: jest.fn() }))
jest.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: {
    div: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    span: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  },
  useReducedMotion: () => true,
}))
jest.mock('@/components/recap/RecapSlide', () => ({
  RecapSlide: ({ card }: { card: { title: string } }) => <div>{card.title}</div>,
}))
jest.mock('@/components/recap/RecapSharePreview', () => ({
  RecapSharePreview: () => null,
}))
jest.mock('@/components/profileCards/ProfileImage', () => ({
  ProfileImage: () => null,
}))
jest.mock('@/components/recap/RecapControls', () => ({
  RecapControls: ({ onNext, onPrevious }: { onNext: () => void; onPrevious: () => void }) => (
    <>
      <button onClick={onPrevious}>Назад</button>
      <button onClick={onNext}>Вперёд</button>
    </>
  ),
}))

const profile = { id: 'profile-1', name: 'Тест' } as GetProfileResponse
const recap = {
  cards: [
    { cta: null, id: 'first', title: 'Первый' },
    {
      cta: { action: 'open_favorites', label: 'Открыть' },
      id: 'final',
      title: 'Финальный',
    },
  ],
  user_id: profile.id,
  year: 2026,
} as RecapResponse

describe('RecapViewer analytics', () => {
  beforeEach(() => jest.mocked(sendRecapEvent).mockClear())

  it('deduplicates slide views and completes recap once', async () => {
    render(<StrictMode><RecapViewer profile={profile} recap={recap} /></StrictMode>)
    await waitFor(() =>
      expect(sendRecapEvent).toHaveBeenCalledWith({
        event: 'slide_viewed',
        cta_visible: false,
      }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Вперёд' }))
    await waitFor(() =>
      expect(sendRecapEvent).toHaveBeenCalledWith({
        event: 'slide_viewed',
        cta_visible: true,
      }),
    )
    expect(sendRecapEvent).toHaveBeenCalledWith({ event: 'recap_completed' })

    fireEvent.click(screen.getByRole('button', { name: 'Назад' }))
    fireEvent.click(screen.getByRole('button', { name: 'Вперёд' }))
    expect(jest.mocked(sendRecapEvent).mock.calls.filter(([event]) => event.event === 'slide_viewed')).toHaveLength(2)
    expect(jest.mocked(sendRecapEvent).mock.calls.filter(([event]) => event.event === 'recap_completed')).toHaveLength(1)
  })
})
