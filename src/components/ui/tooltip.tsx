import { Tooltip as RadixTooltip } from 'radix-ui'
import type { ReactNode } from 'react'
import { Kbd } from './kbd'

interface TooltipProps {
  content: ReactNode
  shortcut?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  children: ReactNode
}

export function Tooltip({ content, shortcut, side = 'top', children }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          collisionPadding={8}
          className="z-[60] flex animate-fade-in items-center gap-2 rounded-md bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-float"
        >
          {content}
          {shortcut && <Kbd tone="dark">{shortcut}</Kbd>}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}

export const TooltipProvider = RadixTooltip.Provider
