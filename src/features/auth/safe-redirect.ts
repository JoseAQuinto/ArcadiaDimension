/** Only allows same-origin relative paths to avoid open redirects. */
export function safeRedirect(target: string | null): string {
  return target && target.startsWith('/') && !target.startsWith('//') ? target : '/'
}
