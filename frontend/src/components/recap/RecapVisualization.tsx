import { lazy, Suspense } from 'react'

import type { RecapVisualization as RecapVisualizationData } from '@/types/recap.type'

const RecapBarChart = lazy(() => import('./RecapBarChart').then((module) => ({ default: module.RecapBarChart })))
const RecapDonutChart = lazy(() => import('./RecapDonutChart').then((module) => ({ default: module.RecapDonutChart })))

interface RecapVisualizationProps {
  visualization?: RecapVisualizationData | null
}

export function RecapVisualization({ visualization }: RecapVisualizationProps) {
  if (!visualization || visualization.version !== 1) return null
  if (visualization.type !== 'donut' && visualization.type !== 'bar') return null
  const chart = visualization.type === 'donut'
    ? <RecapDonutChart visualization={visualization} />
    : <RecapBarChart visualization={visualization} />

  return (
    <Suspense fallback={<div className="mt-4 h-64 animate-pulse rounded-[28px] border border-white/80 bg-white/45" />}>
      {chart}
    </Suspense>
  )
}
