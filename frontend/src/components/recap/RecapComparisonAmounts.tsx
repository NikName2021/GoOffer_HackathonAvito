import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { formatCurrency } from '@/utils/formatterNumber'
import type { AmountComparison, RecapForecast } from '@/types/recap.type'

interface RecapComparisonAmountsProps {
  forecast?: RecapForecast | null
  previousYear: number
  currentYear: number
  salesRevenue: AmountComparison
  spending: AmountComparison
}

const chartConfig = {
  sales: { color: '#965eeb', label: 'Продажи' },
  spending: { color: '#00aaff', label: 'Расходы' },
} satisfies ChartConfig

function formatChange(comparison: AmountComparison) {
  const absolute = `${comparison.absolute_change > 0 ? '+' : comparison.absolute_change < 0 ? '−' : ''}${formatCurrency(Math.abs(comparison.absolute_change))}`
  return comparison.percent_change === null ? `${absolute} · Новый показатель` : `${absolute} · ${comparison.percent_change > 0 ? '+' : ''}${comparison.percent_change}%`
}

export function RecapComparisonAmounts({ forecast, previousYear, currentYear, salesRevenue, spending }: RecapComparisonAmountsProps) {
  const usableForecast = forecast && forecast.method !== 'unavailable' ? forecast : null
  const data = [
    { label: String(previousYear), sales: salesRevenue.previous, spending: spending.previous },
    { label: String(currentYear), sales: salesRevenue.current, spending: spending.current },
    ...(usableForecast ? [{ forecast: true, label: String(usableForecast.year), sales: usableForecast.sales_revenue.expected, spending: usableForecast.spending.expected }] : []),
  ]

  return (
    <section className="mt-4 rounded-[28px] border border-white/80 bg-white/70 p-3 shadow-sm backdrop-blur-xl sm:p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f6ff] px-2.5 py-1 text-[#007acc]"><i className="size-2 rounded-full bg-[#00aaff]" />Расходы</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1eafd] px-2.5 py-1 text-[#7a44ce]"><i className="size-2 rounded-full bg-[#965eeb]" />Продажи</span>
        {usableForecast && <span className="rounded-full border border-dashed border-[#8a8d91] px-2.5 py-1 text-[#6f7377]">{usableForecast.year} — прогноз</span>}
      </div>
      <ChartContainer className="mt-3 h-[190px] w-full" config={chartConfig}>
        <BarChart accessibilityLayer data={data} margin={{ left: -10, right: 8, top: 14 }}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} />
          <XAxis axisLine={false} dataKey="label" tickLine={false} />
          <YAxis axisLine={false} tickFormatter={(value) => `${Math.round(value / 1_000)} тыс.`} tickLine={false} width={47} />
          <ChartTooltip content={<ChartTooltipContent unit="₽" />} cursor={{ fill: 'rgba(0,170,255,.06)' }} />
          <Bar dataKey="spending" fill="#00aaff" maxBarSize={28} radius={[6, 6, 2, 2]}>
            {data.map((item) => <Cell fill="#00aaff" fillOpacity={item.forecast ? 0.35 : 1} key={item.label} stroke={item.forecast ? '#00aaff' : 'none'} strokeDasharray={item.forecast ? '4 3' : undefined} />)}
          </Bar>
          <Bar dataKey="sales" fill="#965eeb" maxBarSize={28} radius={[6, 6, 2, 2]}>
            {data.map((item) => <Cell fill="#965eeb" fillOpacity={item.forecast ? 0.35 : 1} key={item.label} stroke={item.forecast ? '#965eeb' : 'none'} strokeDasharray={item.forecast ? '4 3' : undefined} />)}
          </Bar>
        </BarChart>
      </ChartContainer>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <AmountChange color="text-[#007acc]" label="Расходы" value={formatChange(spending)} />
        <AmountChange color="text-[#7a44ce]" label="Продажи" value={formatChange(salesRevenue)} />
      </div>
      {usableForecast && (
        <p className="mt-3 rounded-2xl bg-[#f7f8f9] px-3 py-2 text-xs leading-5 text-[#6f7377]">
          Ориентировочный прогноз на {usableForecast.year}: расходы {formatCurrency(usableForecast.spending.expected)} ({formatCurrency(usableForecast.spending.min)}–{formatCurrency(usableForecast.spending.max)}), продажи {formatCurrency(usableForecast.sales_revenue.expected)} ({formatCurrency(usableForecast.sales_revenue.min)}–{formatCurrency(usableForecast.sales_revenue.max)}).
        </p>
      )}
    </section>
  )
}

function AmountChange({ color, label, value }: { color: string; label: string; value: string }) {
  return <p className="rounded-2xl bg-[#f7f8f9] px-3 py-2 text-xs text-[#6f7377]"><b className={color}>{label}:</b> {value}</p>
}
