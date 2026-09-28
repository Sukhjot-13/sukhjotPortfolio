/**
 * Shared input validation (pure — unit-tested, no DB/env access).
 * Used by the contact API route; client forms mirror the same rules.
 */

export const CONTACT_FIELD_LIMITS = {
  name: 120,
  email: 254,
  message: 5000,
} as const

export const PROJECT_WRITE_FIELDS = [
  'slug',
  'title',
  'blurb',
  'description',
  'role',
  'date',
  'tech',
  'image',
  'gallery',
  'demo',
  'github',
] as const

export const TESTIMONIAL_WRITE_FIELDS = [
  'name',
  'role',
  'quote',
  'avatar',
] as const

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

/** Honeypot: bots fill hidden fields, humans never see them. */
export function isHoneypotTripped(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false
  const value = (body as Record<string, unknown>).website
  return typeof value === 'string' && value.trim().length > 0
}

export function isWithinLimit(
  value: unknown,
  max: number,
): value is string {
  return typeof value === 'string' && value.length <= max
}

export function exceedsAnyLimit(
  body: Record<string, unknown>,
  limits: Record<string, number>,
): boolean {
  for (const [field, max] of Object.entries(limits)) {
    const value = body[field]
    if (typeof value === 'string' && value.length > max) return true
  }
  return false
}

/** Mongo treats top-level `$`-prefixed keys as atomic update operators. */
export function hasDollarKey(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  for (const key of Object.keys(value)) {
    if (key.startsWith('$')) return true
  }
  return false
}

/** Allow-list projection — anything not listed is dropped. */
export function pick<T extends Record<string, unknown>>(
  source: unknown,
  fields: readonly string[],
): Partial<T> {
  const out: Record<string, unknown> = {}
  if (typeof source !== 'object' || source === null) return out as Partial<T>
  for (const field of fields) {
    const value = (source as Record<string, unknown>)[field]
    if (value !== undefined) out[field] = value
  }
  return out as Partial<T>
}

/** Project links must be absolute http(s) URLs or empty. */
export function isValidExternalUrl(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true
  return typeof value === 'string' && /^https?:\/\//i.test(value)
}

export function hasInvalidProjectUrl(body: Record<string, unknown>): boolean {
  return !isValidExternalUrl(body.demo) || !isValidExternalUrl(body.github)
}
