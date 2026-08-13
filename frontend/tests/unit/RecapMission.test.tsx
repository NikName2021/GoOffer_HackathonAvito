import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react'

import { RecapMission } from '@/components/recap/mission/RecapMission'
import { useMission, useSelectMission } from '@/hooks/useMission'
import type { MissionOption, MissionOverview, MissionState } from '@/types/mission.type'

jest.mock('@/api/recapEvents', () => ({ sendRecapEvent: jest.fn() }))
jest.mock('@/hooks/useMission', () => ({ useMission: jest.fn(), useSelectMission: jest.fn() }))
jest.mock('@/components/recap/mission/MissionProgress', () => ({ MissionProgress: ({ mission }: { mission: MissionState }) => <div>{mission.title}: {mission.progress_percent}%</div> }))

const options: MissionOption[] = [
  { code: 'sell_three_items', cta: { action: 'create_listing', label: 'Разместить' }, description: 'Продажи', icon: 'recycle', target: 3, theme: 'avito-green', title: 'Продать вещи' },
  { code: 'buy_from_favorites', cta: { action: 'open_favorites', label: 'Избранное' }, description: 'Покупка', icon: 'heart', target: 1, theme: 'avito-red', title: 'Купить избранное' },
  { code: 'try_avito_delivery', cta: { action: 'open_delivery_items', label: 'Доставка' }, description: 'Доставка', icon: 'delivery', target: 1, theme: 'avito-blue', title: 'Попробовать доставку' },
]
const state = (option: MissionOption, progress = 0): MissionState => ({ ...option, progress, progress_percent: progress * 33, recap_year: 2026, selected_at: '', status: 'active', updated_at: '' })
const mutate = jest.fn()

function mockOverview(selected_missions: MissionState[] = []) {
  const overview: MissionOverview = { options, selected: null, selected_missions }
  jest.mocked(useMission).mockReturnValue({ data: overview, isError: false, isPending: false } as ReturnType<typeof useMission>)
}

describe('RecapMission', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOverview()
    jest.mocked(useSelectMission).mockReturnValue({ error: null, isError: false, isPending: false, mutate } as unknown as ReturnType<typeof useSelectMission>)
  })

  it('selects two and three missions as a full set', () => {
    render(<RecapMission profileId="profile-1" year={2026} />)
    fireEvent.click(screen.getByRole('button', { name: /Продать вещи/ }))
    fireEvent.click(screen.getByRole('button', { name: /Купить избранное/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить миссии' }))
    expect(mutate).toHaveBeenCalledWith(['sell_three_items', 'buy_from_favorites'], expect.any(Object))

    fireEvent.click(screen.getByRole('button', { name: /Попробовать доставку/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить миссии' }))
    expect(mutate).toHaveBeenLastCalledWith(['sell_three_items', 'buy_from_favorites', 'try_avito_delivery'], expect.any(Object))
  })

  it('removes one mission and clears all through codes array', () => {
    mockOverview([state(options[0]), state(options[1])])
    render(<RecapMission profileId="profile-1" year={2026} />)
    fireEvent.click(screen.getByRole('button', { name: 'Изменить выбранные миссии' }))
    fireEvent.click(screen.getByRole('button', { name: /Купить избранное/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить миссии' }))
    expect(mutate).toHaveBeenCalledWith(['sell_three_items'], expect.any(Object))

    fireEvent.click(screen.getByRole('button', { name: 'Очистить выбор' }))
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить миссии' }))
    expect(mutate).toHaveBeenLastCalledWith([], expect.any(Object))
  })

  it('renders progress for every selected mission', () => {
    mockOverview([state(options[0], 1), state(options[2], 2)])
    render(<RecapMission profileId="profile-1" year={2026} />)
    expect(screen.getByText('Продать вещи: 33%')).toBeInTheDocument()
    expect(screen.getByText('Попробовать доставку: 66%')).toBeInTheDocument()
  })
})
