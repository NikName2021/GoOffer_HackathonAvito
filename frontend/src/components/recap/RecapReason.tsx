import { ChevronDown, Info } from 'lucide-react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface RecapReasonProps {
  reason: string
}

export function RecapReason({ reason }: RecapReasonProps) {
  return (
    <Collapsible className="group mt-4 max-w-2xl pb-5 sm:pb-6">
      <CollapsibleTrigger className="flex cursor-pointer items-center gap-2 rounded-xl bg-white/65 px-3 py-2 text-left text-xs font-bold text-[#515459] transition hover:bg-white">
        <Info aria-hidden="true" className="size-4 text-[#00aaff]" />
        Почему это попало в мои итоги?
        <ChevronDown aria-hidden="true" className="size-4 transition group-data-panel-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pt-2 text-xs leading-5 text-[#6f7377]">
        {reason}
      </CollapsibleContent>
    </Collapsible>
  )
}
