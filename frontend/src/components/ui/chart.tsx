import { createContext, useContext, useId, type ComponentProps, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import { ResponsiveContainer, Tooltip, type TooltipContentProps } from 'recharts'

import { cn } from '@/lib/utils'

export type ChartConfig = Record<string, { color: string; label: ReactNode }>

const ChartContext = createContext<ChartConfig>({})

function ChartContainer({ children, className, config, ...props }: Omit<ComponentProps<'div'>, 'children'> & {
  children: ReactElement
  config: ChartConfig
}) {
  const id = `chart-${useId().replace(/:/g, '')}`
  const style = Object.fromEntries(Object.entries(config).map(([key, item]) => [`--color-${key}`, item.color])) as CSSProperties

  return (
    <ChartContext.Provider value={config}>
      <div
        className={cn('flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-[#8a8d91] [&_.recharts-cartesian-grid_line]:stroke-[#dfe3e7] [&_.recharts-curve.recharts-tooltip-cursor]:stroke-[#cbd3d9] [&_.recharts-polar-grid_[stroke="#ccc"]]:stroke-[#dfe3e7] [&_.recharts-sector]:outline-none', className)}
        data-chart={id}
        style={style}
        {...props}
      >
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

function ChartTooltipContent({ active, className, label, payload, unit }: Partial<TooltipContentProps<number, string>> & {
  className?: string
  unit?: string
}) {
  const config = useContext(ChartContext)
  if (!active || !payload?.length) return null

  return (
    <div className={cn('min-w-36 rounded-2xl border border-white/80 bg-white/95 px-3 py-2.5 text-xs shadow-[0_12px_35px_rgba(31,31,31,.16)] backdrop-blur-xl', className)}>
      {label !== undefined && <p className="mb-2 font-bold text-[#1f1f1f]">{label}</p>}
      <div className="grid gap-1.5">
        {payload.map((item) => {
          const source = item.payload as { key?: string } | undefined
          const key = String(source?.key ?? item.dataKey ?? item.name ?? '')
          const itemConfig = config[key]
          return (
            <div className="flex items-center gap-2" key={key}>
              <span className="size-2 rounded-full" style={{ backgroundColor: item.color ?? itemConfig?.color }} />
              <span className="text-[#6f7377]">{itemConfig?.label ?? item.name}</span>
              <b className="ml-auto text-[#1f1f1f]">{Number(item.value ?? 0).toLocaleString('ru-RU')} {unit}</b>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ChartTooltip = Tooltip

export { ChartContainer, ChartTooltip, ChartTooltipContent }
