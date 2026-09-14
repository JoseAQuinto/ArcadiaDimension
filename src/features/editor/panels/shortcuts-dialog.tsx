import { Fragment } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Kbd } from '@/components/ui/kbd'

interface Shortcut {
  label: string
  /** Alternatives, each one a key combination. */
  keys: string[][]
}

const GROUPS: { title: string; shortcuts: Shortcut[] }[] = [
  {
    title: 'Edición',
    shortcuts: [
      { label: 'Deshacer', keys: [['Ctrl', 'Z']] },
      { label: 'Rehacer', keys: [['Ctrl', 'Y'], ['Ctrl', 'Shift', 'Z']] },
      { label: 'Duplicar', keys: [['Ctrl', 'D']] },
      { label: 'Copiar / pegar', keys: [['Ctrl', 'C'], ['Ctrl', 'V']] },
      { label: 'Eliminar', keys: [['Supr'], ['Retroceso']] },
      { label: 'Rotar 90°', keys: [['R'], ['Shift', 'R']] },
      { label: 'Mover 10 cm', keys: [['←', '↑', '→', '↓']] },
      { label: 'Mover una celda', keys: [['Shift', 'Flechas']] },
    ],
  },
  {
    title: 'Vista',
    shortcuts: [
      { label: 'Zoom en el cursor', keys: [['Ctrl', 'Rueda']] },
      { label: 'Acercar / alejar', keys: [['Ctrl', '+'], ['Ctrl', '−']] },
      { label: 'Ajustar a pantalla', keys: [['Ctrl', '0']] },
      { label: 'Desplazar el plano', keys: [['Arrastrar fondo'], ['Rueda']] },
      { label: 'Cuadrícula', keys: [['G']] },
      { label: 'Ajustar a cuadrícula', keys: [['S']] },
      { label: 'Mapa de ocupación', keys: [['O']] },
    ],
  },
  {
    title: 'Navegación',
    shortcuts: [
      { label: 'Buscar artículo', keys: [['Ctrl', 'F'], ['/']] },
      { label: 'Ver ubicaciones del rack', keys: [['Enter'], ['Doble clic']] },
      { label: 'Deseleccionar', keys: [['Esc']] },
      { label: 'Mostrar atajos', keys: [['?']] },
    ],
  },
]

export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Atajos de teclado" size="lg">
      <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
        {GROUPS.map((group) => (
          <section key={group.title} className={group.title === 'Edición' ? 'md:row-span-2' : undefined}>
            <h3 className="mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{group.title}</h3>
            <ul className="divide-y divide-slate-100">
              {group.shortcuts.map((shortcut) => (
                <li key={shortcut.label} className="flex items-center justify-between gap-4 py-2 text-sm">
                  <span className="text-slate-700">{shortcut.label}</span>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400">
                    {shortcut.keys.map((combo, index) => (
                      <Fragment key={combo.join('+')}>
                        {index > 0 && <span>o</span>}
                        <span className="flex items-center gap-0.5">
                          {combo.map((key) => (
                            <Kbd key={key}>{key}</Kbd>
                          ))}
                        </span>
                      </Fragment>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Dialog>
  )
}
