import { useState, type FormEvent } from 'react'
import type { Warehouse } from '@shared/api'
import { createWarehouseSchema } from '@shared/schemas'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Textarea } from '@/components/ui/field'
import { toast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/api-client'
import { cn } from '@/lib/cn'
import { apiFieldErrors, parseNumberInput, zodFieldErrors, type FieldErrors } from '@/lib/form'
import { formatInteger } from '@/lib/format'
import { useCreateWarehouse, useUpdateWarehouse } from './api'

const PRESETS = [
  { label: 'Pequeño', width: 40, height: 30 },
  { label: 'Mediano', width: 80, height: 50 },
  { label: 'Grande', width: 120, height: 80 },
]

interface WarehouseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When provided the dialog edits this warehouse instead of creating one. */
  warehouse?: Pick<Warehouse, 'id' | 'name' | 'description' | 'width' | 'height'> | null
  onSaved?: (warehouse: Warehouse) => void
}

export function WarehouseFormDialog({ open, onOpenChange, warehouse, onSaved }: WarehouseFormDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={warehouse ? 'Editar almacén' : 'Nuevo almacén'}
      description={
        warehouse ? 'Actualiza los datos generales del plano.' : 'Define el nombre y las dimensiones del plano en metros.'
      }
      size="md"
    >
      {/* Remount on open so the form always starts from fresh values. */}
      {open && <WarehouseForm warehouse={warehouse} onCancel={() => onOpenChange(false)} onSaved={onSaved} />}
    </Dialog>
  )
}

function WarehouseForm({
  warehouse,
  onCancel,
  onSaved,
}: Pick<WarehouseFormDialogProps, 'warehouse' | 'onSaved'> & { onCancel: () => void }) {
  const createWarehouse = useCreateWarehouse()
  const updateWarehouse = useUpdateWarehouse()
  const isEditing = Boolean(warehouse)
  const mutation = isEditing ? updateWarehouse : createWarehouse

  const [values, setValues] = useState({
    name: warehouse?.name ?? '',
    description: warehouse?.description ?? '',
    width: String(warehouse?.width ?? 120),
    height: String(warehouse?.height ?? 80),
  })
  const [errors, setErrors] = useState<FieldErrors>({})

  const width = parseNumberInput(values.width)
  const height = parseNumberInput(values.height)
  const dimensionsValid = Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0

  const set = (field: keyof typeof values, value: string) => setValues((current) => ({ ...current, [field]: value }))

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const result = createWarehouseSchema.safeParse({ ...values, width, height })
    if (!result.success) {
      setErrors(zodFieldErrors(result.error))
      return
    }
    setErrors({})

    const handlers = {
      onSuccess: (saved: Warehouse) => {
        toast.success(isEditing ? 'Almacén actualizado' : `Almacén «${saved.name}» creado`)
        onSaved?.(saved)
        onCancel()
      },
      onError: (error: unknown) => {
        const fieldErrors = apiFieldErrors(error)
        if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors)
        else toast.error(getErrorMessage(error))
      },
    }

    if (warehouse) updateWarehouse.mutate({ id: warehouse.id, input: result.data }, handlers)
    else createWarehouse.mutate(result.data, handlers)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Field label="Nombre" error={errors.name}>
        {(field) => (
          <Input
            {...field}
            placeholder="Almacén Valencia"
            value={values.name}
            maxLength={80}
            onChange={(event) => set('name', event.target.value)}
            autoFocus
          />
        )}
      </Field>

      <Field label="Descripción" error={errors.description} optional>
        {(field) => (
          <Textarea
            {...field}
            placeholder="Centro logístico regional, nave 2…"
            value={values.description}
            maxLength={500}
            onChange={(event) => set('description', event.target.value)}
          />
        )}
      </Field>

      <div className="grid grid-cols-[1fr_1fr_auto] items-start gap-3">
        <Field label="Ancho" error={errors.width}>
          {(field) => (
            <Input
              {...field}
              type="number"
              inputMode="decimal"
              min={5}
              max={2000}
              step="any"
              suffix="m"
              value={values.width}
              onChange={(event) => set('width', event.target.value)}
            />
          )}
        </Field>
        <Field label="Alto" error={errors.height}>
          {(field) => (
            <Input
              {...field}
              type="number"
              inputMode="decimal"
              min={5}
              max={2000}
              step="any"
              suffix="m"
              value={values.height}
              onChange={(event) => set('height', event.target.value)}
            />
          )}
        </Field>
        <DimensionPreview width={width} height={height} valid={dimensionsValid} />
      </div>

      {!isEditing && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Plantillas:</span>
          {PRESETS.map((preset) => {
            const active = width === preset.width && height === preset.height
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => setValues((current) => ({ ...current, width: String(preset.width), height: String(preset.height) }))}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition focus-visible:ring-4 focus-visible:ring-brand-500/25 focus-visible:outline-none',
                  active
                    ? 'border-brand-300 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                {preset.label} · {preset.width} × {preset.height}
              </button>
            )
          })}
        </div>
      )}

      {isEditing && (
        <p className="text-xs text-slate-500">
          Reducir las dimensiones no elimina elementos: los que queden fuera podrás recolocarlos en el editor.
        </p>
      )}

      <div className="-mx-6 mt-2 -mb-5 flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-3.5">
        <Button variant="ghost" onClick={onCancel} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" loading={mutation.isPending}>
          {isEditing ? 'Guardar cambios' : 'Crear y abrir editor'}
        </Button>
      </div>
    </form>
  )
}

function DimensionPreview({ width, height, valid }: { width: number; height: number; valid: boolean }) {
  const box = 56
  const scale = valid ? box / Math.max(width, height) : 0
  return (
    <div className="flex w-24 flex-col items-center gap-1.5 pt-6">
      <div className="flex size-14 items-center justify-center">
        {valid && (
          <div
            className="rounded-[3px] border-2 border-brand-500 bg-brand-50 transition-all"
            style={{ width: Math.max(6, width * scale), height: Math.max(6, height * scale) }}
          />
        )}
      </div>
      <span className="text-[11px] text-slate-500 tabular-nums">{valid ? `${formatInteger(Math.round(width * height))} m²` : '—'}</span>
    </div>
  )
}
