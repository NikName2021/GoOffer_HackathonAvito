import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { CategoryComparison, RecapForecast } from '@/types/recap.type'

interface RecapComparisonCategoriesProps {
  categories: CategoryComparison[]
  forecast?: RecapForecast | null
  previousYear: number
  currentYear: number
  newInterests: string[]
}

export function RecapComparisonCategories({ categories, forecast, previousYear, currentYear, newInterests }: RecapComparisonCategoriesProps) {
  const chartConfig = {
    current: { color: '#00aaff', label: String(currentYear) },
    previous: { color: '#b9dff2', label: String(previousYear) },
  } satisfies ChartConfig
  const usableForecast = forecast && forecast.method !== 'unavailable' ? forecast : null

  return (
    <section className="mt-4 rounded-[28px] border border-white/80 bg-white/70 p-3 shadow-sm backdrop-blur-xl sm:p-4">
      <p className="text-xs font-bold text-[#515459]">Интересы по активности</p>
      <ChartContainer className="mt-3 h-[190px] w-full" config={chartConfig}>
        <BarChart accessibilityLayer data={categories} layout="vertical" margin={{ left: 8, right: 8 }}>
          <CartesianGrid horizontal={false} strokeDasharray="4 4" />
          <XAxis axisLine={false} tickLine={false} type="number" />
          <YAxis axisLine={false} dataKey="category" tickLine={false} type="category" width={90} />
          <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: 'rgba(0,170,255,.06)' }} />
          <Bar dataKey="previous_score" fill="#b9dff2" name={String(previousYear)} maxBarSize={18} radius={[0, 5, 5, 0]} />
          <Bar dataKey="current_score" fill="#00aaff" name={String(currentYear)} maxBarSize={18} radius={[0, 5, 5, 0]} />
        </BarChart>
      </ChartContainer>
      {categories.some((category) => category.is_new) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {categories.filter((category) => category.is_new).map((category) => <span className="rounded-full bg-[#e7faef] px-2.5 py-1 text-[11px] font-bold text-[#008842]" key={category.category}>{category.category} · Новый интерес</span>)}
        </div>
      )}
      {newInterests.length > 0 && <p className="mt-3 text-xs leading-5 text-[#6f7377]">Новые интересы: <b className="text-[#1f1f1f]">{newInterests.join(', ')}</b></p>}
      {usableForecast && usableForecast.likely_categories.length > 0 && (
        <p className="mt-2 rounded-2xl bg-[#f1eafd] px-3 py-2 text-xs leading-5 text-[#6d4ba3]">Вероятные интересы {usableForecast.year}: {usableForecast.likely_categories.map((item) => item.category).join(', ')}. Прогноз ориентировочный.</p>
      )}
    </section>
  )
}
