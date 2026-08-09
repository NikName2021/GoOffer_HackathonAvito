import { useMemo, useState } from 'react'
import { Cell, Pie, PieChart } from 'recharts'

import { getRecapChartColor } from './recapChartColors'
import { Button } from '@/components/ui/button'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import type { RecapVisualization } from '@/types/recap.type'

interface RecapDonutChartProps {
  visualization: RecapVisualization
}

export function RecapDonutChart({ visualization }: RecapDonutChartProps) {
  const segments = useMemo(() => (visualization.segments ?? []).filter((segment) => segment.value > 0), [visualization.segments])
  const initialIndex = Math.min(visualization.highlight?.index ?? 0, Math.max(segments.length - 1, 0))
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  const active = segments[activeIndex]
  const config = Object.fromEntries(segments.map((segment) => [segment.key, {
    color: getRecapChartColor(segment.color),
    label: segment.label,
  }])) satisfies ChartConfig

  if (!segments.length) return null

  return (
    <div className="mt-4 grid items-center gap-3 rounded-[28px] border border-white/80 bg-white/65 p-3 shadow-sm backdrop-blur-xl sm:grid-cols-[minmax(0,1fr)_220px] sm:p-4">
      <div className="relative min-w-0">
        <ChartContainer className="mx-auto h-[200px] w-full max-w-[420px]" config={config}>
          <PieChart>
            <Pie
              animationDuration={650}
              data={segments}
              dataKey="value"
              innerRadius={52}
              nameKey="label"
              onClick={(_, index) => setActiveIndex(index)}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              outerRadius={82}
              paddingAngle={3}
              stroke="rgba(255,255,255,.9)"
              strokeWidth={3}
            >
              {segments.map((segment, index) => <Cell fill={getRecapChartColor(segment.color)} key={segment.key} opacity={index === activeIndex ? 1 : 0.55} />)}
            </Pie>
          </PieChart>
        </ChartContainer>
        {active && (
          <div className="pointer-events-none absolute inset-0 grid place-content-center px-3 text-center">
            <b className="text-2xl font-black text-[#1f1f1f]">{Math.round(active.value * 100 / total)}%</b>
            <span className="mt-0.5 max-w-24 text-xs leading-4 text-balance text-[#8a8d91]">{active.label}</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
        {segments.map((segment, index) => (
          <Button
            className="h-auto min-w-0 justify-start rounded-2xl px-3 py-2"
            key={segment.key}
            onClick={() => setActiveIndex(index)}
            style={index === activeIndex ? { borderColor: getRecapChartColor(segment.color), backgroundColor: `${getRecapChartColor(segment.color)}12` } : undefined}
            variant="outline"
          >
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: getRecapChartColor(segment.color) }} />
            <span className="min-w-0 truncate">{segment.label}</span>
            <b className="ml-auto">{segment.value}</b>
          </Button>
        ))}
      </div>
    </div>
  )
}
