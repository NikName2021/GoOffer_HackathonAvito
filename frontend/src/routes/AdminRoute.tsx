import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { PATHS } from '@/config/paths'
import { useAppSelector } from '@/store/hooks'

interface AdminRouteProps {
  children: ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { account, status } = useAppSelector((state) => state.auth)

  if (status === 'checking') {
    return <div className="grid min-h-dvh place-items-center text-sm text-[#6f7377]">Проверяем права доступа…</div>
  }
  if (!account?.isAdmin) return <Navigate replace to={PATHS.HOME} />
  return children
}
