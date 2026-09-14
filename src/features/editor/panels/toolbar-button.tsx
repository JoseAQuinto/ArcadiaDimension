import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/cn'

interface ToolbarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  shortcut?: string
  /** Renders the button as a toggle. */
  pressed?: boolean
}

export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(function ToolbarButton(
  { label, shortcut, pressed, className, children, ...props },
  ref,
) {
  return (
    <Tooltip content={label} shortcut={shortcut}>
      <button
        ref={ref}
        type="button"
        aria-label={label}
        aria-pressed={pressed}
        className={cn(
          'inline-flex size-8 shrink-0 items-center justify-center rounded-md transition focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-35 [&_svg]:size-4',
          pressed
            ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    </Tooltip>
  )
})

export function ToolbarDivider() {
  return <span className="mx-1.5 h-5 w-px shrink-0 bg-slate-200" aria-hidden="true" />
}
