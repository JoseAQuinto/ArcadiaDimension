import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const controlBase =
  'w-full rounded-lg border bg-white text-sm text-slate-900 shadow-panel transition outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'

const stateClass = (invalid?: boolean) =>
  invalid ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15' : 'border-slate-200 hover:border-slate-300'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
  suffix?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, suffix, className, ...props },
  ref,
) {
  const input = (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, stateClass(invalid), 'h-10 px-3', suffix ? 'pr-9' : undefined, className)}
      {...props}
    />
  )
  if (!suffix) return input

  return (
    <div className="relative">
      {input}
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">
        {suffix}
      </span>
    </div>
  )
})

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, stateClass(invalid), 'min-h-20 resize-none px-3 py-2', className)}
      {...props}
    />
  )
})

interface FieldProps {
  label: ReactNode
  error?: string
  hint?: ReactNode
  optional?: boolean
  className?: string
  children: (props: { id: string; invalid: boolean; 'aria-describedby'?: string }) => ReactNode
}

/** Label + control + hint/error with the accessibility wiring done once. */
export function Field({ label, error, hint, optional, className, children }: FieldProps) {
  const id = useId()
  const messageId = `${id}-message`
  const message = error ?? hint

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="flex items-baseline justify-between text-[13px] font-medium text-slate-700">
        {label}
        {optional && <span className="text-xs font-normal text-slate-400"> Opcional</span>}
      </label>
      {children({ id, invalid: Boolean(error), 'aria-describedby': message ? messageId : undefined })}
      {message && (
        <p id={messageId} className={cn('text-xs', error ? 'text-rose-600' : 'text-slate-500')}>
          {message}
        </p>
      )}
    </div>
  )
}
