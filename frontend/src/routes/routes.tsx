import { Route, Routes } from 'react-router-dom'
import { PATHS } from '@/config/paths'
import { HomePage } from '@/pages/Home'
import { RecapPage } from '@/pages/RecapPage'
import { SharePage } from '@/pages/SharePage'
import { LoginPage } from '@/pages/LoginPage'
import { ComparePage } from '@/pages/ComparePage'

export function AppRouter() {
  return (
    <Routes>
      <Route path={PATHS.LOGIN} element={<LoginPage />} />
      <Route path={PATHS.HOME} element={<HomePage />} />
      <Route path={PATHS.RECAP} element={<RecapPage />} />
      <Route path={PATHS.SHARE} element={<SharePage />} />
      <Route path={PATHS.COMPARE} element={<ComparePage />} />
    </Routes>
  )
}