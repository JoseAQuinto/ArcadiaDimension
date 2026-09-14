/**
 * Returns the first string `code` found on an error or its `cause` chain.
 * Drizzle wraps driver errors, so Postgres codes (e.g. 23505) live in `cause`.
 */
export function getErrorCode(error: unknown): string | undefined {
  let current: unknown = error
  for (let depth = 0; depth < 5 && typeof current === 'object' && current !== null; depth++) {
    if ('code' in current && typeof current.code === 'string' && !current.code.startsWith('FST_')) {
      return current.code
    }
    current = 'cause' in current ? current.cause : undefined
  }
  return undefined
}

export const UNIQUE_VIOLATION = '23505'
