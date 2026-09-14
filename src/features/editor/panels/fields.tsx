import { Check } from 'lucide-react'
import { useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { clamp, roundTo } from '../lib/geometry'

const fieldFrame =
  'flex h-8 items-center rounded-md border bg-white text-[13px] shadow-panel transition focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20'

export function PanelSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-b border-slate-100 px-4 py-4">
      <div className="mb-3 flex min-h-5 items-center justify-between">
        <h3 className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

interface NumberFieldProps {
  /** Short visible label, e.g. "X". */
  label: string
  /** Accessible name, e.g. "Posición X". */
  name: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  precision?: number
  suffix?: string
  integer?: boolean
  className?: string
}

const SCRUB_PIXELS_PER_STEP = 2

/**
 * Numeric input with live updates, arrow-key stepping and Figma-like scrubbing:
 * drag horizontally on the label to change the value.
 */
export function NumberField({
  label,
  name,
  value,
  onChange,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  precision = 2,
  suffix,
  integer = false,
  className,
}: NumberFieldProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState<string | null>(null)
  const [invalid, setInvalid] = useState(false)
  const scrub = useRef<{ startX: number; startValue: number; moved: boolean } | null>(null)

  const normalize = (next: number) => roundTo(clamp(integer ? Math.round(next) : next, min, max), integer ? 0 : precision)
  const format = (next: number) => String(roundTo(next, integer ? 0 : precision)).replace('.', ',')

  const commit = (next: number) => {
    const normalized = normalize(next)
    if (normalized !== value) onChange(normalized)
  }

  const handleChange = (text: string) => {
    setDraft(text)
    const parsed = Number(text.replace(',', '.'))
    const valid =
      text.trim() !== '' && Number.isFinite(parsed) && parsed >= min && parsed <= max && (!integer || Number.isInteger(parsed))
    setInvalid(!valid)
    if (valid) commit(parsed)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur()
    } else if (event.key === 'Escape') {
      setDraft(null)
      setInvalid(false)
      event.currentTarget.blur()
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      const next = normalize(value + (event.key === 'ArrowUp' ? 1 : -1) * step * (event.shiftKey ? 10 : 1))
      setDraft(format(next))
      setInvalid(false)
      commit(next)
    }
  }

  const handlePointerDown = (event: PointerEvent<HTMLLabelElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    scrub.current = { startX: event.clientX, startValue: value, moved: false }
  }

  const handlePointerMove = (event: PointerEvent<HTMLLabelElement>) => {
    const state = scrub.current
    if (!state) return
    const steps = Math.round((event.clientX - state.startX) / SCRUB_PIXELS_PER_STEP)
    if (steps !== 0) state.moved = true
    commit(state.startValue + steps * step * (event.shiftKey ? 10 : 1))
  }

  const handlePointerUp = (event: PointerEvent<HTMLLabelElement>) => {
    const state = scrub.current
    if (!state) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    scrub.current = null
    if (!state.moved) inputRef.current?.focus()
  }

  return (
    <div className={cn(fieldFrame, invalid ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300', className)}>
      <label
        htmlFor={id}
        title={`${name} · arrastra para ajustar`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex h-full min-w-7 shrink-0 cursor-ew-resize items-center justify-center px-2 text-[11px] font-medium text-slate-400 select-none hover:text-brand-600"
      >
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="decimal"
        aria-label={name}
        aria-invalid={invalid || undefined}
        value={draft ?? format(value)}
        onFocus={(event) => {
          setDraft(format(value))
          event.currentTarget.select()
        }}
        onBlur={() => {
          setDraft(null)
          setInvalid(false)
        }}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={handleKeyDown}
        className="h-full w-full min-w-0 bg-transparent pr-1 text-slate-800 tabular-nums outline-none"
      />
      {suffix && <span className="pr-2 text-[11px] text-slate-400">{suffix}</span>}
    </div>
  )
}

interface TextFieldProps {
  label: string
  value: string
  onCommit: (value: string) => void
  validate?: (value: string) => string | null
  transform?: (value: string) => string
  maxLength?: number
  mono?: boolean
}

/** Text property committed on every valid keystroke; invalid drafts are never applied. */
export function TextField({ label, value, onCommit, validate, transform, maxLength, mono }: TextFieldProps) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const error = draft !== null && validate ? validate(draft) : null

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-slate-600">
        {label}
      </label>
      <div className={cn(fieldFrame, error ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300')}>
        <input
          id={id}
          value={draft ?? value}
          maxLength={maxLength}
          aria-invalid={Boolean(error) || undefined}
          onFocus={() => setDraft(value)}
          onBlur={() => setDraft(null)}
          onChange={(event) => {
            const next = transform ? transform(event.target.value) : event.target.value
            setDraft(next)
            if (!validate?.(next)) onCommit(next)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === 'Escape') event.currentTarget.blur()
          }}
          className={cn('h-full w-full min-w-0 bg-transparent px-2.5 text-slate-800 outline-none', mono && 'font-mono')}
        />
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  )
}

interface SelectFieldProps<T extends string> {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

export function SelectField<T extends string>({ label, value, options, onChange }: SelectFieldProps<T>) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-slate-600">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[13px] text-slate-800 shadow-panel outline-none hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

interface ColorFieldProps {
  value: string | null
  defaultColor: string
  swatches: string[]
  onChange: (color: string | null) => void
}

export function ColorField({ value, defaultColor, swatches, onChange }: ColorFieldProps) {
  const swatch = (color: string | null, label: string) => {
    const active = value === color
    const display = color ?? defaultColor
    return (
      <button
        key={label}
        type="button"
        title={label}
        aria-label={label}
        aria-pressed={active}
        onClick={() => onChange(color)}
        className={cn(
          'flex size-6 items-center justify-center rounded-md ring-offset-2 transition focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none',
          active ? 'ring-2 ring-slate-900/70' : 'hover:scale-110',
          color === null && 'bg-[conic-gradient(var(--tw-gradient-stops))] from-white via-slate-100 to-white',
        )}
        style={{ backgroundColor: color === null ? undefined : display }}
      >
        {color === null ? (
          <span className="size-3.5 rounded-sm" style={{ backgroundColor: defaultColor }} />
        ) : (
          active && <Check className="size-3.5 text-white" />
        )}
      </button>
    )
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-slate-600">Color</p>
      <div className="flex flex-wrap gap-1.5">
        {swatch(null, 'Color automático')}
        {swatches.map((color) => swatch(color, color))}
      </div>
    </div>
  )
}
