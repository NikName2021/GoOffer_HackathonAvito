import { Select as SelectPrimitive } from '@base-ui/react/select'
import { Check, ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

function Select<Value>(props: SelectPrimitive.Root.Props<Value>) {
  return <SelectPrimitive.Root {...props} />
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return <SelectPrimitive.Value className={cn('min-w-0 flex-1 truncate text-left', className)} {...props} />
}

function SelectTrigger({ className, children, ...props }: SelectPrimitive.Trigger.Props) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex h-[38px] w-full items-center gap-2 rounded-xl border border-[#dfe1e3] bg-white px-3 text-sm font-medium text-[#1f1f1f] outline-none transition',
        'hover:border-[#b8dff5] data-popup-open:border-[#00aaff] data-popup-open:ring-3 data-popup-open:ring-[#00aaff]/15',
        'focus-visible:border-[#00aaff] focus-visible:ring-3 focus-visible:ring-[#00aaff]/15 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="ml-auto text-[#8a8d91]">
        <ChevronDown className="size-4 transition-transform data-popup-open:rotate-180" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({ className, children, ...props }: SelectPrimitive.Popup.Props) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner alignItemWithTrigger={false} className="z-[100] outline-none" sideOffset={6}>
        <SelectPrimitive.Popup
          className={cn(
            'min-w-[var(--anchor-width)] origin-[var(--transform-origin)] overflow-hidden rounded-2xl border border-[#e2e4e6] bg-white p-1.5 text-[#1f1f1f] shadow-[0_12px_36px_rgba(0,0,0,0.14)] outline-none',
            'transition-[transform,opacity] duration-150 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0',
            className,
          )}
          {...props}
        >
          <SelectPrimitive.List className="max-h-[var(--available-height)] space-y-0.5 overflow-y-auto outline-none">
            {children}
          </SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex min-h-10 cursor-default items-center gap-2 rounded-xl py-2 pr-9 pl-3 text-sm outline-none select-none',
        'data-highlighted:bg-[#e8f6ff] data-highlighted:text-[#007acc] data-selected:bg-[#f2f9fd] data-disabled:pointer-events-none data-disabled:opacity-40',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex min-w-0 items-center gap-2">{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-3 text-[#00aaff]">
        <Check className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
