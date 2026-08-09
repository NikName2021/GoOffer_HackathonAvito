import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react'
import { StrictMode, type ReactNode } from 'react'

import { sendRecapEvent } from '@/api/recapEvents'
import { RecapExperience } from '@/components/recap/RecapExperience'
import type { GetProfileResponse } from '@/types/profileResponse.type'
import type { RecapResponse } from '@/types/recap.type'

jest.mock('@/api/recapEvents', () => ({ sendRecapEvent: jest.fn() }))

jest.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: {
    div: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  },
  useReducedMotion: () => true,
}))

jest.mock('@/components/recap/RecapGiftIntro', () => ({
  RecapGiftIntro: ({ onOpen }: { onOpen: () => void }) => <button onClick={onOpen}>Распаковать</button>,
}))

jest.mock('@/components/recap/RecapViewer', () => ({
  RecapViewer: () => <div>Слайды итогов</div>,
}))

const profile = {
  highlights: {},
  id: 'profile-1',
  joinedAt: '2020-01-01T00:00:00Z',
  name: 'Тестовый профиль',
  ownAds: [],
  purchases: [],
  sales: [],
  stats: {},
  views: [],
} as GetProfileResponse

const recap = {
  cards: [],
  id: 'recap-1',
  user_id: profile.id,
  year: 2026,
} as RecapResponse

describe('RecapExperience', () => {
  beforeEach(() => {
    window.localStorage.clear()
    jest.mocked(sendRecapEvent).mockClear()
  })

  it('shows the gift once and opens slides after unpacking', () => {
    const { unmount } = render(<StrictMode><RecapExperience profile={profile} recap={recap} /></StrictMode>)

    expect(sendRecapEvent).toHaveBeenCalledWith({ event: 'recap_opened' })
    expect(jest.mocked(sendRecapEvent).mock.calls.filter(([event]) => event.event === 'recap_opened')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Распаковать' }))
    expect(sendRecapEvent).toHaveBeenCalledWith({ event: 'gift_opened' })
    expect(screen.getByText('Слайды итогов')).toBeInTheDocument()

    unmount()
    render(<RecapExperience profile={profile} recap={recap} />)

    expect(screen.queryByRole('button', { name: 'Распаковать' })).not.toBeInTheDocument()
    expect(screen.getByText('Слайды итогов')).toBeInTheDocument()
  })
})
