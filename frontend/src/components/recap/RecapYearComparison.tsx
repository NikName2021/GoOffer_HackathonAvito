import { ChevronDown, LoaderCircle, TrendingUp } from 'lucide-react'
import { useState } from 'react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useGenerateRecap } from '@/hooks/useRecap'
import type { RecapResponse } from '@/types/recap.type'

interface RecapYearComparisonProps {
  recap: RecapResponse
}

function formatDelta(current: number, previous: number) {
  const delta = current - previous
  if (delta === 0) return 'без изменений'
  return `${delta > 0 ? '+' : '−'}${Math.abs(delta)}`
}

function projectedValue(current: number, previous: number) {
  return Math.max(0, current + (current - previous))
}

export function RecapYearComparison({ recap }: RecapYearComparisonProps) {
  const [open, setOpen] = useState(false)
  const previousMutation = useGenerateRecap()
  const previousYear = recap.year - 1

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen && !previousMutation.data && !previousMutation.isPending) {
      previousMutation.mutate({ user_id: recap.user_id, year: previousYear })
    }
  }

  const previous = previousMutation.data
  const currentCategory = recap.summary.combined.main_category || 'Новая категория'
  const previousCategory = previous?.summary.combined.main_category || 'нет данных'

  return (
    <Collapsible className="mt-4" onOpenChange={handleOpenChange} open={open}>
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 py-3 text-left text-sm font-bold text-[#1f1f1f] shadow-sm">
        <TrendingUp aria-hidden="true" className="size-5 text-[#00c565]" />
        Сравнить с {previousYear} годом
        <ChevronDown aria-hidden="true" className={`ml-auto size-4 transition ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        {previousMutation.isPending && <div className="grid min-h-20 place-items-center"><LoaderCircle className="size-6 animate-spin text-[#00aaff]" /></div>}
        {previousMutation.error && <p className="rounded-xl bg-white/70 p-3 text-xs text-[#6f7377]">Не удалось получить итоги {previousYear} года.</p>}
        {previous && (
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-3"><span className="text-xs text-[#8a8d91]">Покупки</span><p className="mt-1 font-black">{recap.total_purchases} <small className="text-[#00c565]">{formatDelta(recap.total_purchases, previous.total_purchases)}</small></p></div>
            <div className="rounded-2xl bg-white p-3"><span className="text-xs text-[#8a8d91]">Продажи</span><p className="mt-1 font-black">{recap.total_sales} <small className="text-[#965eeb]">{formatDelta(recap.total_sales, previous.total_sales)}</small></p></div>
            <div className="rounded-2xl bg-white p-3"><span className="text-xs text-[#8a8d91]">Главный интерес</span><p className="mt-1 truncate font-black">{currentCategory}</p><small className="text-[#8a8d91]">было: {previousCategory}</small></div>
            <p className="rounded-2xl bg-[#eaf8ff] p-3 text-xs leading-5 text-[#515459] sm:col-span-3">
              Ориентир на {recap.year + 1}: около {projectedValue(recap.total_purchases, previous.total_purchases)} покупок и {projectedValue(recap.total_sales, previous.total_sales)} продаж. Это простая оценка по динамике двух лет, а не точный прогноз.
            </p>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
