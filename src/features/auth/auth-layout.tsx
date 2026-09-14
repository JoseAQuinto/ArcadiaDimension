import { Layers, PackageSearch, Ruler } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Logo } from '@/components/brand/logo'
import { FloorPlanIllustration } from './floor-plan-illustration'

const FEATURES = [
  { icon: Ruler, title: 'Editor con precisión métrica', text: 'Arrastra, redimensiona y rota con ajuste a cuadrícula.' },
  { icon: Layers, title: 'Ubicaciones por rack', text: 'Genera filas y columnas y asigna stock a cada hueco.' },
  { icon: PackageSearch, title: 'Ocupación y búsqueda', text: 'Localiza artículos y detecta racks saturados de un vistazo.' },
]

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link to="/login" className="self-start rounded-lg focus-visible:ring-4 focus-visible:ring-brand-500/30 focus-visible:outline-none">
          <Logo />
        </Link>
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </main>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} ArcadiaDimension · Visual Warehouse Designer</p>
      </div>

      <aside className="relative hidden overflow-hidden bg-ink-900 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="absolute inset-0 blueprint-grid" aria-hidden="true" />
        <div
          className="absolute -top-40 -right-32 size-[520px] rounded-full bg-brand-600/25 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative">
          <p className="text-xs font-semibold tracking-[0.18em] text-brand-300 uppercase">Visual Warehouse Designer</p>
          <h2 className="mt-4 max-w-md text-3xl leading-tight font-semibold tracking-tight text-white xl:text-4xl">
            Diseña tu almacén como un producto digital.
          </h2>
        </div>

        <FloorPlanIllustration className="relative my-10 w-full max-w-xl self-center" />

        <ul className="relative grid gap-5 xl:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <div className="mb-2.5 flex size-8 items-center justify-center rounded-lg bg-white/5 text-brand-300 ring-1 ring-white/10">
                <Icon className="size-4" />
              </div>
              <p className="text-sm font-medium text-white">{title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-400">{text}</p>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
