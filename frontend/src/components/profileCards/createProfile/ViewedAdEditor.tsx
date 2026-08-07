import { ChevronDown, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { AdBaseFields } from './AdBaseFields'
import { ViewedAdEventsEditor } from './ViewedAdEventsEditor'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { CreateViewedAdRequest } from '@/types/profileRequest.type'
import { formatCount } from '@/utils/formatterNumber'

interface ViewedAdEditorProps {
  index: number
  onChange: (view: CreateViewedAdRequest) => void
  onRemove: () => void
  view: CreateViewedAdRequest
}

export function ViewedAdEditor({ index, onChange, onRemove, view }: ViewedAdEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const watches = view.viewedAt.filter((event) => event.type === 'watch').length

  return (
    <Collapsible className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-[#fafafa]" onOpenChange={setIsOpen} open={isOpen}>
      <header className="flex items-center gap-2 px-4 py-3">
        <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-3 text-left" type="button">
          <ChevronDown className={`size-4 shrink-0 text-[#8a8d91] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-[#1f1f1f]">{view.title.trim() || `Просмотр ${index + 1}`}</span>
            <span className="block truncate text-[11px] text-[#8a8d91]">{view.category.trim() || 'Категория не указана'} · {formatCount(watches, ['просмотр', 'просмотра', 'просмотров'])}</span>
          </span>
        </CollapsibleTrigger>
        <Button aria-label={`Удалить просмотр ${index + 1}`} className="size-8 text-[#8a8d91] hover:bg-[#fff0f2] hover:text-[#ff4053]" onClick={onRemove} size="icon" type="button" variant="ghost">
          <Trash2 className="size-4" />
        </Button>
      </header>

      <CollapsibleContent className="space-y-4 border-t border-[#e7e9eb] px-4 pt-4 pb-4">
        <AdBaseFields onChange={(patch) => onChange({ ...view, ...patch })} value={view} />
        <ViewedAdEventsEditor events={view.viewedAt} onChange={(viewedAt) => onChange({ ...view, viewedAt })} />
      </CollapsibleContent>
    </Collapsible>
  )
}
