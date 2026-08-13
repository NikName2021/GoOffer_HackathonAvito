import { render, screen } from '@testing-library/react'
import { jest } from '@jest/globals'

import { ProfileMissions } from '@/components/profileCards/details/ProfileMissions'
import { useProfileMissions } from '@/hooks/useMission'
import type { MissionState } from '@/types/mission.type'

jest.mock('@/hooks/useMission', () => ({ useProfileMissions: jest.fn() }))

const mission = (year: number, code: MissionState['code'], title: string, status: MissionState['status']): MissionState => ({
  code,
  completed_at: status === 'completed' ? '2027-01-01T00:00:00Z' : undefined,
  cta: { action: 'open_favorites', label: 'Открыть' },
  description: title,
  icon: 'heart',
  progress: status === 'completed' ? 1 : 0,
  progress_percent: status === 'completed' ? 100 : 0,
  recap_year: year,
  selected_at: '',
  status,
  target: 1,
  theme: 'avito-red',
  title,
  updated_at: '',
})

describe('ProfileMissions', () => {
  it('does not render an empty mission list', () => {
    jest.mocked(useProfileMissions).mockReturnValue({ data: { missions: [] }, isError: false, isPending: false } as ReturnType<typeof useProfileMissions>)
    const { container } = render(<ProfileMissions enabled profileId="profile-1" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders active and completed missions grouped by recap year', () => {
    jest.mocked(useProfileMissions).mockReturnValue({
      data: { missions: [mission(2027, 'buy_from_favorites', 'Миссия 2027', 'active'), mission(2026, 'try_avito_delivery', 'Миссия 2026', 'completed')] },
      isError: false,
      isPending: false,
    } as ReturnType<typeof useProfileMissions>)
    render(<ProfileMissions enabled profileId="profile-1" />)
    expect(screen.getByText('Итоги 2027 года')).toBeInTheDocument()
    expect(screen.getByText('Итоги 2026 года')).toBeInTheDocument()
    expect(screen.getByText('Активна')).toBeInTheDocument()
    expect(screen.getByText('Выполнена')).toBeInTheDocument()
  })
})
