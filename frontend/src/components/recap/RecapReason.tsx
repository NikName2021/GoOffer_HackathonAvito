import { ChevronDown, Info } from 'lucide-react'
import { motion } from 'motion/react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface RecapReasonProps {
  reason: string
}

export function RecapReason({ reason }: RecapReasonProps) {
  return (
    <Collapsible className="group mt-4 max-w-2xl pb-5 sm:pb-6">
      <CollapsibleTrigger className="flex cursor-pointer items-center gap-2 rounded-2xl border border-white/80 bg-white/60 px-4 py-3 text-left text-xs font-bold text-[#515459] shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-md">
        <span className="grid size-7 place-items-center rounded-xl bg-[#eaf8ff] text-[#00aaff]"><Info aria-hidden="true" className="size-4" /></span>
        Почему это попало в мои итоги?
        <ChevronDown aria-hidden="true" className="size-4 transition group-data-panel-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 text-xs leading-5 text-[#6f7377]">
        <motion.p animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/70 bg-white/55 px-4 py-3 backdrop-blur-lg" initial={{ opacity: 0, y: -6 }}>{reason}</motion.p>
      </CollapsibleContent>
    </Collapsible>
  )
}
