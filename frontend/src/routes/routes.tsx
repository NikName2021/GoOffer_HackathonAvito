import { Route, Routes } from 'react-router-dom'
import { PATHS } from '@/config/paths'
import { HomePage } from '@/pages/Home'
import { AvitoPage } from '@/pages/Avito'

export function AppRouter() {
  const navigations = [
    { path: PATHS.HOME, element: <HomePage /> },
    { path: `${PATHS.AVITO}/*`, element: <AvitoPage /> },
  ] as const

  return (
    <Routes>
      {navigations.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}
    </Routes>
  )
}
