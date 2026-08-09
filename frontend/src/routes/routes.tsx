import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import { PATHS } from '@/config/paths'
import { AdminRoute } from './AdminRoute'

const HomePage = lazy(() => import('@/pages/Home').then((module) => ({ default: module.HomePage })))
const AvitoPage = lazy(() => import('@/pages/Avito').then((module) => ({ default: module.AvitoPage })))
const RecapSettingsPage = lazy(() =>
  import('@/pages/RecapSettings').then((module) => ({ default: module.RecapSettingsPage })),
)

export function AppRouter() {
  const navigations = [
    { path: PATHS.HOME, element: <HomePage /> },
    { path: `${PATHS.AVITO}/*`, element: <AvitoPage /> },
    {
      path: PATHS.RECAP_SETTINGS,
      element: (
        <AdminRoute>
          <RecapSettingsPage />
        </AdminRoute>
      ),
    },
  ] as const

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {navigations.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Routes>
    </Suspense>
  )
}

function RouteFallback() {
  return (
    <div className="grid min-h-dvh place-items-center bg-white text-sm font-medium text-[#6f7377]">
      Загружаем страницу…
    </div>
  )
}
