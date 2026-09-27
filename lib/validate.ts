/**
 * Shared input validation (pure — unit-tested, no DB/env access).
 * Used by the contact API route; client forms mirror the same rules.
 */

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function isValidEmail(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  )
}

/** Escape text for interpolation into HTML email bodies. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
