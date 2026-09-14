import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useRouteError } from 'react-router'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { buttonClassName } from '@/components/ui/button-styles'
import { useDocumentTitle } from '@/hooks/use-document-title'

interface ErrorLayoutProps {
  code: string
  title: string
  description: string
  action?: ReactNode
}

function ErrorLayout({ code, title, description, action }: ErrorLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <Link to="/" className="mb-12">
        <Logo />
      </Link>
      <p className="font-mono text-sm font-semibold tracking-widest text-brand-600">{code}</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">{description}</p>
      <div className="mt-8 flex gap-2">
        {action ?? (
          <Link to="/" className={buttonClassName({ variant: 'primary' })}>
            <ArrowLeft />
            Volver a almacenes
          </Link>
        )}
      </div>
    </div>
  )
}

export function NotFoundPage() {
  useDocumentTitle('Página no encontrada')
  return (
    <ErrorLayout
      code="404"
      title="Esta página no existe"
      description="Puede que el enlace sea incorrecto o que el recurso se haya eliminado."
    />
  )
}

export function RouteErrorPage() {
  const error = useRouteError()
  if (import.meta.env.DEV) console.error(error)

  return (
    <ErrorLayout
      code="ERROR"
      title="Algo no ha ido bien"
      description="Se ha producido un error inesperado al mostrar esta pantalla. Recarga la página para continuar."
      action={
        <Button variant="primary" onClick={() => window.location.reload()}>
          Recargar página
        </Button>
      }
    />
  )
}
