import { Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { RackLocation } from '@shared/api'
import { locationContentSchema } from '@shared/schemas'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { toast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/api-client'
import { cn } from '@/lib/cn'
import { apiFieldErrors, parseNumberInput, zodFieldErrors, type FieldErrors } from '@/lib/form'
import { formatRelativeTime } from '@/lib/format'
import { useClearLocationContent, useSaveLocationContent } from '../api'

interface LocationDetailProps {
  warehouseId: string
  rackId: string
  location: RackLocation
}

export function LocationDetail({ warehouseId, rackId, location }: LocationDetailProps) {
  const saveContent = useSaveLocationContent(warehouseId, rackId)
  const clearContent = useClearLocationContent(warehouseId, rackId)
  const { content } = location

  const initial = {
    articleCode: content?.articleCode ?? '',
    description: content?.description ?? '',
    quantity: content ? String(content.quantity) : '',
    lot: content?.lot ?? '',
  }
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [confirmingClear, setConfirmingClear] = useState(false)

  const dirty = (Object.keys(initial) as (keyof typeof initial)[]).some((key) => values[key].trim() !== initial[key])
  const set = (field: keyof typeof values, value: string) => setValues((current) => ({ ...current, [field]: value }))

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const result = locationContentSchema.safeParse({ ...values, quantity: parseNumberInput(values.quantity) })
    if (!result.success) {
      setErrors(zodFieldErrors(result.error))
      return
    }
    setErrors({})
    saveContent.mutate(
      { locationId: location.id, input: result.data },
      {
        onSuccess: () => toast.success(`Ubicación ${location.code} actualizada`),
        onError: (error) => {
          const fieldErrors = apiFieldErrors(error)
          if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors)
          else toast.error(getErrorMessage(error))
        },
      },
    )
  }

  const handleClear = () =>
    clearContent.mutate(location.id, {
      onSuccess: () => toast.success(`Ubicación ${location.code} vaciada`),
      onError: (error) => toast.error(getErrorMessage(error)),
    })

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col" noValidate>
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Ubicación</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <h3 className="font-mono text-lg font-semibold text-slate-900">{location.code}</h3>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-medium',
              content ? 'bg-brand-100 text-brand-700' : 'bg-slate-200/70 text-slate-600',
            )}
          >
            {content ? 'Ocupada' : 'Vacía'}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Fila {location.row} · Columna {location.column}
          {content && ` · Actualizada ${formatRelativeTime(content.updatedAt)}`}
        </p>
      </div>

      <div className="flex-1 space-y-3.5 px-5 py-4">
        <Field label="Artículo" error={errors.articleCode}>
          {(field) => (
            <Input
              {...field}
              value={values.articleCode}
              onChange={(event) => set('articleCode', event.target.value.toUpperCase())}
              placeholder="ART-00125"
              maxLength={40}
              className="font-mono"
              autoFocus={!content}
            />
          )}
        </Field>
        <Field label="Descripción" error={errors.description} optional>
          {(field) => (
            <Input
              {...field}
              value={values.description}
              onChange={(event) => set('description', event.target.value)}
              placeholder="Tornillo M8"
              maxLength={160}
            />
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cantidad" error={errors.quantity}>
            {(field) => (
              <Input
                {...field}
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                suffix="uds"
                value={values.quantity}
                onChange={(event) => set('quantity', event.target.value)}
                placeholder="0"
              />
            )}
          </Field>
          <Field label="Lote" error={errors.lot} optional>
            {(field) => (
              <Input
                {...field}
                value={values.lot}
                onChange={(event) => set('lot', event.target.value)}
                placeholder="L260914"
                maxLength={40}
                className="font-mono"
              />
            )}
          </Field>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3.5">
        {content &&
          (confirmingClear ? (
            <>
              <Button variant="danger" size="sm" onClick={handleClear} loading={clearContent.isPending}>
                Confirmar vaciado
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmingClear(false)} disabled={clearContent.isPending}>
                Cancelar
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => setConfirmingClear(true)}
            >
              <Trash2 />
              Vaciar
            </Button>
          ))}
        {!confirmingClear && (
          <Button type="submit" variant="primary" size="sm" className="ml-auto" loading={saveContent.isPending} disabled={!dirty}>
            {content ? 'Guardar cambios' : 'Asignar contenido'}
          </Button>
        )}
      </div>
    </form>
  )
}
