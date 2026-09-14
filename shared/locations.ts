export interface LocationSlot {
  row: number
  column: number
  code: string
}

export function padPosition(position: number): string {
  return String(position).padStart(2, '0')
}

/** Builds the human readable code of a rack position, e.g. `A-01-03`. */
export function buildLocationCode(rackCode: string, row: number, column: number): string {
  return `${rackCode}-${padPosition(row)}-${padPosition(column)}`
}

/** Returns every position of a rack ordered by row and then column. */
export function generateLocationSlots(rackCode: string, rows: number, columns: number): LocationSlot[] {
  const slots: LocationSlot[] = []
  for (let row = 1; row <= rows; row++) {
    for (let column = 1; column <= columns; column++) {
      slots.push({ row, column, code: buildLocationCode(rackCode, row, column) })
    }
  }
  return slots
}

/** Spreadsheet-style sequence: 0 → A, 25 → Z, 26 → AA, 27 → AB… */
export function rackCodeFromIndex(index: number): string {
  let code = ''
  let remaining = index
  do {
    code = String.fromCharCode(65 + (remaining % 26)) + code
    remaining = Math.floor(remaining / 26) - 1
  } while (remaining >= 0)
  return code
}

/** First code of the A, B, C… sequence that is not already used. */
export function nextRackCode(usedCodes: Iterable<string>): string {
  const used = new Set(usedCodes)
  for (let index = 0; ; index++) {
    const candidate = rackCodeFromIndex(index)
    if (!used.has(candidate)) return candidate
  }
}
