import { DropdownMenu as RadixMenu } from 'radix-ui'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export const DropdownMenu = RadixMenu.Root
export const DropdownMenuTrigger = RadixMenu.Trigger

export function DropdownMenuContent({
  children,
  align = 'end',
  side = 'bottom',
  className,
}: {
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'bottom'
  className?: string
}) {
  return (
    <RadixMenu.Portal>
      <RadixMenu.Content
        align={align}
        side={side}
        sideOffset={6}
        collisionPadding={8}
        className={cn(
          'z-50 min-w-48 animate-fade-in rounded-xl border border-slate-200 bg-white p-1 shadow-float',
          className,
        )}
      >
        {children}
      </RadixMenu.Content>
    </RadixMenu.Portal>
  )
}

/** `asChild` is not supported: the item always renders its icon next to the children. */
interface ItemProps extends Omit<ComponentProps<typeof RadixMenu.Item>, 'asChild'> {
  icon?: ReactNode
  tone?: 'default' | 'danger'
}

export function DropdownMenuItem({ icon, tone = 'default', className, children, ...props }: ItemProps) {
  return (
    <RadixMenu.Item
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4',
        tone === 'danger'
          ? 'text-rose-600 data-[highlighted]:bg-rose-50'
          : 'text-slate-700 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </RadixMenu.Item>
  )
}

export function DropdownMenuSeparator() {
  return <RadixMenu.Separator className="my-1 h-px bg-slate-100" />
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return <RadixMenu.Label className="px-2.5 py-2">{children}</RadixMenu.Label>
}
