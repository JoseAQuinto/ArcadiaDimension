import { X } from 'lucide-react'
import { Dialog as RadixDialog } from 'radix-ui'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Prevents closing while an async action is running. */
  locked?: boolean
  className?: string
  bodyClassName?: string
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-3xl',
  xl: 'max-w-6xl',
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  locked = false,
  className,
  bodyClassName,
}: DialogProps) {
  const handleOpenChange = (next: boolean) => {
    if (!next && locked) return
    onOpenChange(next)
  }

  return (
    <RadixDialog.Root open={open} onOpenChange={handleOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 animate-fade-in bg-slate-950/40 backdrop-blur-[2px]" />
        <RadixDialog.Content
          className={cn(
            'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 animate-scale-in flex-col rounded-2xl border border-slate-200/80 bg-white shadow-float outline-none',
            sizes[size],
            className,
          )}
          onEscapeKeyDown={(event) => locked && event.preventDefault()}
          onPointerDownOutside={(event) => locked && event.preventDefault()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 pt-5 pb-4">
            <div className="min-w-0">
              <RadixDialog.Title className="text-base font-semibold text-slate-900">{title}</RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="mt-1 text-sm text-slate-500">{description}</RadixDialog.Description>
              ) : (
                <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close
              disabled={locked}
              className="-mt-1 -mr-2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-4 focus-visible:ring-brand-500/30 focus-visible:outline-none disabled:opacity-40"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </RadixDialog.Close>
          </div>
          <div className={cn('min-h-0 flex-1 overflow-y-auto px-6 py-5 scrollbar-thin', bodyClassName)}>{children}</div>
          {footer && (
            <div className="flex items-center justify-end gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50/70 px-6 py-3.5">
              {footer}
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
