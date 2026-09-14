const numberFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 })
const integerFormat = new Intl.NumberFormat('es-ES')
const percentFormat = new Intl.NumberFormat('es-ES', { style: 'percent', maximumFractionDigits: 0 })
const relativeFormat = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
const dateFormat = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' })

export const formatNumber = (value: number) => numberFormat.format(value)
export const formatInteger = (value: number) => integerFormat.format(value)
export const formatPercent = (ratio: number) => percentFormat.format(ratio)
export const formatMeters = (value: number) => `${numberFormat.format(value)} m`
export const formatDateTime = (iso: string) => dateFormat.format(new Date(iso))

const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
]

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000)
  for (const [unit, size] of RELATIVE_STEPS) {
    if (Math.abs(seconds) >= size) return relativeFormat.format(Math.round(seconds / size), unit)
  }
  return 'hace un momento'
}
