import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Kbd({ children, tone = 'light' }: { children: ReactNode; tone?: 'light' | 'dark' }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded px-1 font-sans text-[11px] font-medium',
        tone === 'dark' ? 'bg-white/15 text-white/80' : 'border border-slate-200 bg-slate-50 text-slate-500',
      )}
    >
      {children}
    </kbd>
  )
}
