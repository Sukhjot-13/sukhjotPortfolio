/**
 * In-memory per-key rate limiter (pure enough to unit-test via the `now`
 * option). Process-local: a serverless cold start or a second instance gets a
 * fresh window, so this is abuse friction, not a hard quota.
 */

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

let lastSweep = 0

export const RATE_LIMIT_DEFAULTS = {
  limit: 5,
  windowMs: 60 * 60 * 1000,
} as const

function sweep(now: number, windowMs: number) {
  if (now - lastSweep < windowMs) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export function checkRateLimit(
  key: string,
  options: { limit?: number; windowMs?: number; now?: number } = {},
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const limit = options.limit ?? RATE_LIMIT_DEFAULTS.limit
  const windowMs = options.windowMs ?? RATE_LIMIT_DEFAULTS.windowMs
  const now = options.now ?? Date.now()

  sweep(now, windowMs)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    }
  }

  bucket.count += 1
  return {
    allowed: true,
    remaining: limit - bucket.count,
    retryAfterSeconds: 0,
  }
}

export function resetRateLimiter() {
  buckets.clear()
  lastSweep = 0
}

/** Best-effort client IP from proxy headers, falling back to a shared bucket. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return (
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    'unknown'
  )
}
