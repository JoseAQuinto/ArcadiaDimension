import { useId } from 'react'
import { cn } from '@/lib/cn'

export function LogoMark({ className }: { className?: string }) {
  const gradientId = useId()
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8', className)} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b96ff" />
          <stop offset="1" stopColor="#4146e6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" className="fill-ink-900" />
      <path
        d="M16 6.5 25 11.75v9.5L16 26.5 7 21.25v-9.5Z"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M7 11.75 16 17l9-5.25M16 17v9.5"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="17" r="1.6" fill="#c6cdff" />
    </svg>
  )
}

interface LogoProps {
  className?: string
  tone?: 'light' | 'dark'
  compact?: boolean
}

export function Logo({ className, tone = 'dark', compact = false }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      {!compact && (
        <span
          className={cn(
            'text-[15px] leading-none tracking-tight',
            tone === 'dark' ? 'text-slate-900' : 'text-white',
          )}
        >
          <span className="font-semibold">Arcadia</span>
          <span className={cn('font-normal', tone === 'dark' ? 'text-brand-600' : 'text-brand-300')}>Dimension</span>
        </span>
      )}
    </span>
  )
}
