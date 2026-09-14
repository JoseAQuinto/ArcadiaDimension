import { ServerCrash } from 'lucide-react'
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { FullScreenLoader } from '@/components/ui/spinner'
import { getErrorMessage } from '@/lib/api-client'
import { useSession } from './api'
import { safeRedirect } from './safe-redirect'

export function RequireAuth() {
  const session = useSession()
  const location = useLocation()

  if (session.isPending) return <FullScreenLoader />
  if (session.isError) return <ServiceUnavailable error={session.error} onRetry={() => session.refetch()} />
  if (!session.data) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }
  return <Outlet />
}

export function GuestOnly() {
  const session = useSession()
  const [searchParams] = useSearchParams()

  if (session.isPending) return <FullScreenLoader />
  if (session.data) return <Navigate to={safeRedirect(searchParams.get('redirect'))} replace />
  return <Outlet />
}

function ServiceUnavailable({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div className="flex max-w-md flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 shadow-panel">
        <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <ServerCrash className="size-5" />
        </div>
        <h1 className="text-base font-semibold">No se puede acceder al servicio</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {getErrorMessage(error, 'El servidor no responde en este momento.')}
        </p>
        <Button variant="primary" className="mt-6" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    </div>
  )
}
