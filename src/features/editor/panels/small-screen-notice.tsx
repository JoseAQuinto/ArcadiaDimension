import { Monitor } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { buttonClassName } from '@/components/ui/button-styles'
import { useMediaQuery } from '@/hooks/use-media-query'

export function SmallScreenNotice() {
  const isSmallScreen = useMediaQuery('(max-width: 1023px)')
  const [dismissed, setDismissed] = useState(false)

  if (!isSmallScreen || dismissed) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-6 backdrop-blur-sm" role="alertdialog" aria-labelledby="small-screen-title">
      <div className="w-full max-w-sm animate-slide-up rounded-2xl bg-white p-6 text-center shadow-float">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Monitor className="size-6" />
        </div>
        <h2 id="small-screen-title" className="text-base font-semibold text-slate-900">
          Pantalla demasiado pequeña
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Para editar almacenes recomendamos utilizar una pantalla más grande.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link to="/" className={buttonClassName({ variant: 'primary' })}>
            Volver a almacenes
          </Link>
          <Button variant="ghost" onClick={() => setDismissed(true)}>
            Continuar de todos modos
          </Button>
        </div>
      </div>
    </div>
  )
}
