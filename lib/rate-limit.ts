/**
 * rate-limit.ts
 *
 * Lightweight fixed-window rate limiter.
 *
 * Backend priority:
 *   1. Upstash Redis (via REST API) -- if UPSTASH_REDIS_REST_URL and
 *      UPSTASH_REDIS_REST_TOKEN are set. Shared across all Vercel instances.
 *   2. In-memory Map -- local fallback when Upstash is not configured.
 *      Per-instance (resets on cold start / function re-init), adequate for
 *      a low-traffic single-owner store.
 *
 * FAIL-OPEN: any error, timeout, or missing config returns { ok: true }.
 * A small store values availability over strict rate enforcement; a backend
 * hiccup must never block a legitimate order.
 *
 * IP extraction: reads x-forwarded-for and takes the LAST (rightmost) entry.
 * Vercel appends the verified client IP as the final entry in that header, so
 * rightmost is the most trustworthy value and cannot be spoofed by a client
 * injecting an earlier entry in the chain.
 */

// ---------------------------------------------------------------------------
// In-memory fallback store
// ---------------------------------------------------------------------------
interface MemEntry {
  count: number
  expiresAt: number
}
const memStore = new Map<string, MemEntry>()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract the best available client IP from the request. */
function getClientIp(req: Request): string {
  // Vercel appends the real client IP as the rightmost entry in
  // x-forwarded-for, so we take the last segment. A client injecting
  // an early entry cannot spoof this final value.
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const parts = xff.split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length > 0) return parts[parts.length - 1]
  }

  const xri = req.headers.get('x-real-ip')
  if (xri) return xri.trim()

  // No IP header present (local dev / internal call)
  return 'unknown'
}

/** Current fixed-window bucket (integer floor). */
function windowBucket(windowMs: number): number {
  return Math.floor(Date.now() / windowMs)
}

// ---------------------------------------------------------------------------
// Upstash Redis backend
// ---------------------------------------------------------------------------
async function rateLimitUpstash(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; remaining?: number }> {
  const url = process.env.UPSTASH_REDIS_REST_URL!
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 1500) // 1.5 s timeout

  try {
    // INCR atomically increments (creating with 0 if missing) and returns new value
    const incrRes = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!incrRes.ok) return { ok: true } // fail-open on HTTP error

    const { result: count } = (await incrRes.json()) as { result: number }

    if (count === 1) {
      // First hit in this window -- set expiry (PEXPIRE, milliseconds)
      const expController = new AbortController()
      const expTimeout = setTimeout(() => expController.abort(), 1500)
      try {
        await fetch(`${url}/pexpire/${encodeURIComponent(key)}/${windowMs}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          signal: expController.signal,
        })
      } catch {
        // Non-critical: key will be orphaned at most until next bucket resets
      } finally {
        clearTimeout(expTimeout)
      }
    }

    const remaining = Math.max(0, limit - count)
    return { ok: count <= limit, remaining }
  } catch {
    clearTimeout(timeout)
    return { ok: true } // fail-open on timeout or network error
  }
}

// ---------------------------------------------------------------------------
// In-memory backend
// ---------------------------------------------------------------------------
function rateLimitMemory(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining?: number } {
  try {
    const now = Date.now()

    // Purge stale entries lazily to prevent unbounded growth
    if (memStore.size > 5000) {
      memStore.forEach((v, k) => {
        if (v.expiresAt < now) memStore.delete(k)
      })
    }

    const entry = memStore.get(key)
    if (!entry || entry.expiresAt < now) {
      memStore.set(key, { count: 1, expiresAt: now + windowMs })
      return { ok: true, remaining: limit - 1 }
    }

    entry.count++
    const remaining = Math.max(0, limit - entry.count)
    return { ok: entry.count <= limit, remaining }
  } catch {
    return { ok: true } // fail-open
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export interface RateLimitOpts {
  /** Logical action identifier (e.g. 'orders-create'). Scopes the bucket. */
  id: string
  /** Maximum allowed requests per window. */
  limit: number
  /** Window duration in milliseconds. */
  windowMs: number
}

export async function rateLimit(
  req: Request,
  opts: RateLimitOpts,
): Promise<{ ok: boolean; remaining?: number }> {
  try {
    const ip = getClientIp(req)
    const bucket = windowBucket(opts.windowMs)
    const key = `rl:${opts.id}:${ip}:${bucket}`

    const hasUpstash =
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN

    if (hasUpstash) {
      return await rateLimitUpstash(key, opts.limit, opts.windowMs)
    }

    return rateLimitMemory(key, opts.limit, opts.windowMs)
  } catch {
    // Absolute outer catch -- never throw, always fail-open
    return { ok: true }
  }
}
