import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'

import { cn } from '@/lib/utils'

function TooltipProvider(props: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider delay={180} {...props} />
}

function Tooltip(props: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root {...props} />
}

function TooltipTrigger(props: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger {...props} />
}

interface TooltipContentProps extends TooltipPrimitive.Popup.Props {
  align?: TooltipPrimitive.Positioner.Props['align']
  side?: TooltipPrimitive.Positioner.Props['side']
  sideOffset?: number
}

function TooltipContent({ align = 'center', children, className, side = 'top', sideOffset = 8, ...props }: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        collisionAvoidance={{ align: 'shift', fallbackAxisSide: 'none', side: 'flip' }}
        collisionPadding={12}
        positionMethod="fixed"
        side={side}
        sideOffset={sideOffset}
      >
        <TooltipPrimitive.Popup
          className={cn('z-[100] max-w-64 rounded-xl bg-[#1f1f1f] px-3 py-2 text-xs leading-4 text-white shadow-xl transition data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0', className)}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow className="size-2 rotate-45 bg-[#1f1f1f]" />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
