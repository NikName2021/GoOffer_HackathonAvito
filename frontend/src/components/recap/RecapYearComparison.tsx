import { ChevronDown, Sparkles, TrendingUp } from 'lucide-react'
import { useState } from 'react'

import { RecapComparisonAmounts } from './RecapComparisonAmounts'
import { RecapComparisonCategories } from './RecapComparisonCategories'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { formatCurrency } from '@/utils/formatterNumber'
import type { RecapForecast, RecapResponse } from '@/types/recap.type'

interface RecapYearComparisonProps {
  recap: RecapResponse
}

export function RecapYearComparison({ recap }: RecapYearComparisonProps) {
  const [open, setOpen] = useState(false)
  const comparison = recap.comparison
  const forecast: RecapForecast | null = recap.forecast && recap.forecast.method !== 'unavailable' ? recap.forecast : null

  if (!comparison) {
    return <UnavailableComparison message="Сравнение появится после повторной генерации итогов." />
  }

  if (comparison.status === 'unavailable') return <UnavailableComparison message={comparison.message} />

  return (
    <Collapsible className="mt-4" onOpenChange={setOpen} open={open}>
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-left text-sm font-bold text-[#1f1f1f] shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-md">
        <span className="grid size-9 place-items-center rounded-2xl bg-[#e7faef] text-[#00c565]"><TrendingUp aria-hidden="true" className="size-5" /></span>
        {comparison.status === 'first_year' ? 'Первые итоги и прогноз' : `Сравнение с ${comparison.previous_year} годом`}
        <ChevronDown aria-hidden="true" className={`ml-auto size-4 transition ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        {comparison.status === 'first_year' ? (
          <FirstYearComparison comparison={comparison} forecast={forecast} />
        ) : (
          <>
            <p className="px-1 text-xs leading-5 text-[#6f7377]">{comparison.message}</p>
            <RecapComparisonAmounts
              currentYear={comparison.current_year}
              forecast={forecast}
              previousYear={comparison.previous_year}
              salesRevenue={comparison.sales_revenue}
              spending={comparison.spending}
            />
            {comparison.categories.length > 0 && (
              <RecapComparisonCategories
                categories={comparison.categories}
                currentYear={comparison.current_year}
                forecast={forecast}
                newInterests={comparison.new_interests}
                previousYear={comparison.previous_year}
              />
            )}
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

function FirstYearComparison({ comparison, forecast }: { comparison: NonNullable<RecapResponse['comparison']>; forecast: RecapForecast | null }) {
  return (
    <div className="rounded-[28px] border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur-xl">
      <div className="flex items-center gap-2 text-sm font-black text-[#1f1f1f]"><Sparkles className="size-4 text-[#965eeb]" />Это ваши первые итоги года</div>
      <p className="mt-1 text-xs leading-5 text-[#6f7377]">{comparison.message}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <CurrentAmount label="Расходы" value={comparison.spending.current} />
        <CurrentAmount label="Продажи" value={comparison.sales_revenue.current} />
      </div>
      {forecast && <ForecastSummary forecast={forecast} />}
    </div>
  )
}

function CurrentAmount({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-[#f7f8f9] p-3"><span className="text-xs text-[#8a8d91]">{label} за текущий год</span><p className="mt-1 font-black">{formatCurrency(value)}</p></div>
}

function ForecastSummary({ forecast }: { forecast: RecapForecast }) {
  return <p className="mt-3 rounded-2xl bg-[#f1eafd] px-3 py-2 text-xs leading-5 text-[#6d4ba3]">Ориентир на {forecast.year}: расходы {formatCurrency(forecast.spending.expected)}, продажи {formatCurrency(forecast.sales_revenue.expected)}. Прогноз ориентировочный.</p>
}

function UnavailableComparison({ message }: { message: string }) {
  return <p className="mt-4 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-xs leading-5 text-[#6f7377]">{message}</p>
}
