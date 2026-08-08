import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react'

import { sendRecapEvent } from '@/api/recapEvents'
import { RecapMission } from '@/components/recap/mission/RecapMission'
import { useMission, useSelectMission } from '@/hooks/useMission'
import type { MissionOverview } from '@/types/mission.type'

jest.mock('@/api/recapEvents', () => ({ sendRecapEvent: jest.fn() }))
jest.mock('@/hooks/useMission', () => ({ useMission: jest.fn(), useSelectMission: jest.fn() }))
jest.mock('@/components/recap/mission/MissionProgress', () => ({ MissionProgress: () => <div>Прогресс миссии</div> }))

const overview: MissionOverview = {
  options: [{
    code: 'sell_three_items',
    cta: { action: 'create_listing', label: 'Разместить объявление' },
    description: 'Помогите вещам найти новых владельцев.',
    icon: 'recycle',
    target: 3,
    theme: 'avito-green',
    title: 'Продать три ненужные вещи',
  }],
  selected: null,
}

const mutate = jest.fn()

describe('RecapMission', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useMission).mockReturnValue({ data: overview, isError: false, isPending: false } as ReturnType<typeof useMission>)
    jest.mocked(useSelectMission).mockReturnValue({ error: null, isError: false, isPending: false, mutate } as unknown as ReturnType<typeof useSelectMission>)
  })

  it('shows backend options and sends the selected code', () => {
    render(<RecapMission profileId="profile-1" year={2026} />)

    expect(sendRecapEvent).toHaveBeenCalledWith({ event: 'mission_viewed' })
    fireEvent.click(screen.getByRole('button', { name: /Продать три ненужные вещи/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Выбрать миссию' }))

    expect(mutate).toHaveBeenCalledWith('sell_three_items', expect.objectContaining({ onSuccess: expect.any(Function) }))
  })
})
