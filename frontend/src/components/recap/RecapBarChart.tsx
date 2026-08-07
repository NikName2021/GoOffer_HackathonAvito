import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts'

import { getRecapChartColor } from './recapChartColors'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { RecapVisualization } from '@/types/recap.type'

interface RecapBarChartProps {
  visualization: RecapVisualization
}

export function RecapBarChart({ visualization }: RecapBarChartProps) {
  const series = useMemo(() => visualization.series ?? [], [visualization.series])
  const labels = visualization.labels ?? []
  const [visibleKeys, setVisibleKeys] = useState(() => new Set(series.map((item) => item.key)))
  const config = Object.fromEntries(series.map((item) => [item.key, {
    color: getRecapChartColor(item.color),
    label: item.label,
  }])) satisfies ChartConfig
  const data = labels.map((label, index) => Object.fromEntries([
    ['label', label],
    ...series.map((item) => [item.key, item.values[index] ?? 0]),
  ]))

  function toggleSeries(key: string) {
    setVisibleKeys((current) => {
      if (current.has(key) && current.size === 1) return current
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (!labels.length || !series.length) return null

  return (
    <div className="mt-4 rounded-[28px] border border-white/80 bg-white/65 p-3 shadow-sm backdrop-blur-xl sm:p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {series.map((item) => {
          const visible = visibleKeys.has(item.key)
          return (
            <Button
              aria-pressed={visible}
              className="rounded-full"
              key={item.key}
              onClick={() => toggleSeries(item.key)}
              size="sm"
              style={visible ? { borderColor: getRecapChartColor(item.color), backgroundColor: `${getRecapChartColor(item.color)}15` } : undefined}
              variant="outline"
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: getRecapChartColor(item.color) }} />
              {item.label}
            </Button>
          )
        })}
        {visualization.highlight && (
          <span className="ml-auto rounded-full bg-[#fff4dd] px-3 py-1.5 text-xs font-bold text-[#9c6500]">
            Пик: {visualization.highlight.label} · {visualization.highlight.value}
          </span>
        )}
      </div>

      <ChartContainer className="h-[180px] w-full sm:h-[190px]" config={config}>
        <BarChart accessibilityLayer data={data} margin={{ left: -14, right: 8, top: 8 }}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} />
          <XAxis axisLine={false} dataKey="label" minTickGap={12} tickLine={false} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={38} />
          <ChartTooltip content={<ChartTooltipContent unit={visualization.unit} />} cursor={{ fill: 'rgba(0,170,255,.07)', radius: 10 }} />
          {visualization.highlight && <ReferenceLine stroke="#ff9f1a" strokeDasharray="4 4" strokeWidth={2} x={labels[visualization.highlight.index]} />}
          {series.map((item) => visibleKeys.has(item.key) && (
            <Bar
              dataKey={item.key}
              fill={getRecapChartColor(item.color)}
              key={item.key}
              maxBarSize={34}
              radius={[6, 6, 2, 2]}
              stackId={visualization.stacked ? 'activity' : undefined}
            />
          ))}
        </BarChart>
      </ChartContainer>
    </div>
  )
}
