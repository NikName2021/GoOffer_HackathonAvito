import { ChevronDown, Eye, Heart, PackageCheck, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { FormField } from './FormControls'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { CreateViewedAdEventRequest, ViewedAdEventType } from '@/types/profileRequest.type'
import { formatCount } from '@/utils/formatterNumber'

const eventOptions = [
  { type: 'watch', label: 'Просмотр', icon: Eye },
  { type: 'like', label: 'Избранное', icon: Heart },
  { type: 'buy', label: 'Покупка', icon: PackageCheck },
] as const

interface ViewedAdEventsEditorProps {
  events: CreateViewedAdEventRequest[]
  onChange: (events: CreateViewedAdEventRequest[]) => void
}

export function ViewedAdEventsEditor({ events, onChange }: ViewedAdEventsEditorProps) {
  const [isOpen, setIsOpen] = useState(true)

  function addEvent(type: ViewedAdEventType) {
    const next = type === 'buy' ? { type, time: '', useAvitoDelivery: false } : { type, time: '' }
    onChange([...events, next] as CreateViewedAdEventRequest[])
  }

  function updateEvent(index: number, next: CreateViewedAdEventRequest) {
    onChange(events.map((event, eventIndex) => (eventIndex === index ? next : event)))
  }

  const hasLike = events.some((event) => event.type === 'like')
  const hasBuy = events.some((event) => event.type === 'buy')

  return (
    <Collapsible className="overflow-hidden rounded-2xl border border-[#ccecff] bg-[#f7fcff]" onOpenChange={setIsOpen} open={isOpen}>
      <CollapsibleTrigger className="group flex w-full items-center gap-3 px-4 py-3 text-left" type="button">
        <span className="grid size-8 place-items-center rounded-xl bg-[#e5f6ff] text-[#00aaff]"><Eye className="size-4" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-[#1f1f1f]">История активности</span>
          <span className="text-xs text-[#8a8d91]">{formatCount(events.length, ['событие', 'события', 'событий'])} · порядок по дате рассчитает backend</span>
        </span>
        <ChevronDown className="size-4 text-[#8a8d91] transition group-data-open:rotate-180" />
      </CollapsibleTrigger>

      <CollapsibleContent className="border-t border-[#dcecf5] bg-white p-3">
        <div className="space-y-2">
          {events.map((event, index) => (
            <EventRow
              event={event}
              hasBuy={hasBuy}
              hasLike={hasLike}
              index={index}
              key={`${event.type}-${index}`}
              onChange={(next) => updateEvent(index, next)}
              onRemove={() => onChange(events.filter((_, eventIndex) => eventIndex !== index))}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {eventOptions.map(({ icon: Icon, label, type }) => (
            <Button
              className="h-8 rounded-full border-[#dfe1e3] bg-white px-3 text-xs text-[#1f1f1f] hover:bg-[#f2f9fd]"
              disabled={(type === 'like' && hasLike) || (type === 'buy' && hasBuy)}
              key={type}
              onClick={() => addEvent(type)}
              type="button"
              variant="outline"
            >
              <Plus className="size-3.5 text-[#00aaff]" /><Icon className="size-3.5" />{label}
            </Button>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function EventRow({ event, hasBuy, hasLike, index, onChange, onRemove }: {
  event: CreateViewedAdEventRequest
  hasBuy: boolean
  hasLike: boolean
  index: number
  onChange: (event: CreateViewedAdEventRequest) => void
  onRemove: () => void
}) {
  return (
    <div className="grid items-end gap-2 rounded-xl border border-[#eceeef] bg-[#fafafa] p-3 sm:grid-cols-[140px_1fr_auto]">
      <label className="text-xs font-medium text-[#6f7377]">
        Событие
        <select
          className="mt-1.5 h-[38px] w-full rounded-xl border border-[#dfe1e3] bg-white px-3 text-sm outline-none focus:border-[#00aaff]"
          onChange={(change) => onChange(change.target.value === 'buy'
            ? { type: 'buy', time: event.time, useAvitoDelivery: false }
            : { type: change.target.value as 'watch' | 'like', time: event.time })}
          value={event.type}
        >
          {eventOptions.map((option) => (
            <option
              disabled={(option.type === 'like' && hasLike && event.type !== 'like') || (option.type === 'buy' && hasBuy && event.type !== 'buy')}
              key={option.type}
              value={option.type}
            >
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <FormField label={`Дата и время · ${index + 1}`} onChange={(change) => onChange({ ...event, time: change.target.value })} required type="datetime-local" value={event.time} />
      <Button aria-label={`Удалить событие ${index + 1}`} className="size-[38px] text-[#ff4053] hover:bg-[#fff0f2]" onClick={onRemove} size="icon" type="button" variant="ghost">
        <Trash2 className="size-4" />
      </Button>
      {event.type === 'buy' && (
        <label className="flex items-center gap-2 text-xs font-medium text-[#1f1f1f] sm:col-span-3">
          <input checked={event.useAvitoDelivery} className="size-4 accent-[#00aaff]" onChange={(change) => onChange({ ...event, useAvitoDelivery: change.target.checked })} type="checkbox" />
          Покупка через Авито Доставку
        </label>
      )}
    </div>
  )
}
