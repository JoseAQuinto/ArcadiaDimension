import { ChevronRight, Keyboard, Pencil } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { Warehouse } from '@shared/api'
import { LogoMark } from '@/components/brand/logo'
import { UserMenu } from '@/components/layout/user-menu'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { formatNumber } from '@/lib/format'

interface EditorHeaderProps {
  warehouse: Warehouse
  search: ReactNode
  onEditWarehouse: () => void
  onShowShortcuts: () => void
}

export function EditorHeader({ warehouse, search, onEditWarehouse, onShowShortcuts }: EditorHeaderProps) {
  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3">
      <Tooltip content="Volver a almacenes" side="bottom">
        <Link
          to="/"
          aria-label="Volver a almacenes"
          className="rounded-lg transition hover:opacity-90 focus-visible:ring-4 focus-visible:ring-brand-500/30 focus-visible:outline-none"
        >
          <LogoMark />
        </Link>
      </Tooltip>

      <nav aria-label="Ruta de navegación" className="flex min-w-0 shrink items-center gap-1 text-sm">
        <Link to="/" className="rounded-md px-1.5 py-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
          Almacenes
        </Link>
        <ChevronRight className="size-3.5 shrink-0 text-slate-300" />
        <Tooltip content="Editar datos del almacén" side="bottom">
          <button
            type="button"
            onClick={onEditWarehouse}
            className="group flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 font-semibold text-slate-900 transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:outline-none"
          >
            <span className="max-w-56 truncate">{warehouse.name}</span>
            <Pencil className="size-3 shrink-0 text-slate-400 opacity-0 transition group-hover:opacity-100" />
          </button>
        </Tooltip>
        <span className="hidden shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 tabular-nums xl:inline">
          {formatNumber(warehouse.width)} × {formatNumber(warehouse.height)} m
        </span>
      </nav>

      <div className="mx-auto flex w-full max-w-md min-w-56 justify-center px-2">{search}</div>

      <Tooltip content="Atajos de teclado" shortcut="?" side="bottom">
        <Button variant="ghost" size="icon-sm" onClick={onShowShortcuts} aria-label="Atajos de teclado">
          <Keyboard />
        </Button>
      </Tooltip>
      <UserMenu compact />
    </header>
  )
}
