import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useToastStore } from './toast'

const icons = {
  success: <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />,
  error: <XCircle className="size-4 shrink-0 text-rose-400" />,
  info: <Info className="size-4 shrink-0 text-brand-300" />,
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-16 left-1/2 z-[70] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          role={item.tone === 'error' ? 'alert' : 'status'}
          className="pointer-events-auto flex w-full animate-slide-up items-center gap-3 rounded-xl bg-ink-900/95 py-2.5 pr-2 pl-3.5 text-sm text-white shadow-float backdrop-blur"
        >
          {icons[item.tone]}
          <span className="min-w-0 flex-1">{item.message}</span>
          {item.action && (
            <button
              type="button"
              onClick={() => {
                item.action?.onClick()
                dismiss(item.id)
              }}
              className="rounded-md px-2 py-1 text-[13px] font-semibold text-brand-300 hover:bg-white/10 hover:text-brand-200"
            >
              {item.action.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => dismiss(item.id)}
            className="rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white"
            aria-label="Cerrar notificación"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
