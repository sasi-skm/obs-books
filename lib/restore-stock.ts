/**
 * Inventory restoration for cancelled orders.
 *
 * When a customer or admin cancels an order (or when the 24h auto-cancel
 * cron fires on an unpaid order), we need to put the books BACK on the
 * shelf so they're available for other customers.
 *
 * This file is the single source of truth for that logic so:
 *   - the new auto-cancel cron,
 *   - the admin manual `cancel` action,
 *   - the admin `admin_cancel` action (full or partial),
 * all restore stock identically. Before this helper existed, the admin
 * cancel flows did NOT restore stock, silently shrinking inventory every
 * time an admin cancelled an order.
 *
 * Stock model:
 *   - books.copies      : total integer across all conditions
 *   - books.status      : 'available' | 'sold' — flips to 'sold' when
 *                         copies hits 0, back to 'available' when we
 *                         restore at least 1
 *   - books.condition_copies : JSONB map { 'Like New': 2, 'Good': 1, ... }
 *                         present when the admin split inventory by
 *                         condition. If the cancelled item was bought at
 *                         a specific condition, we increment that key.
 *
 * We use plain SELECT + UPDATE (not a DB RPC) so the seed.sql schema
 * stays authoritative and we don't create a new surface-area function
 * that production might not have yet.
 */

export interface RestoreItem {
  book_id: string
  condition?: string | null
  quantity?: number | null
}

export interface RestoreResult {
  restoredCount: number
  failures: Array<{ book_id: string; reason: string }>
}

/**
 * Restore stock for every item passed in. Uses the injected Supabase
 * admin client rather than creating its own, so callers keep control of
 * which client (and connection pool) does the work.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function restoreStock(supabaseAdmin: any, items: RestoreItem[]): Promise<RestoreResult> {
  const result: RestoreResult = { restoredCount: 0, failures: [] }

  if (!Array.isArray(items) || items.length === 0) return result

  // Collapse duplicates: if an order had the same book_id + condition in
  // multiple rows (rare but possible with quantity), merge counts so we
  // make ONE round-trip per unique book.
  const buckets = new Map<string, { book_id: string; condition: string | null; qty: number }>()
  for (const item of items) {
    if (!item.book_id) continue
    const key = `${item.book_id}::${item.condition || ''}`
    const existing = buckets.get(key)
    const qty = Math.max(1, Number(item.quantity) || 1)
    if (existing) {
      existing.qty += qty
    } else {
      buckets.set(key, { book_id: item.book_id, condition: item.condition || null, qty })
    }
  }

  for (const bucket of Array.from(buckets.values())) {
    try {
      // Read current state
      const { data: book, error: fetchError } = await supabaseAdmin
        .from('books')
        .select('id, copies, status, condition_copies')
        .eq('id', bucket.book_id)
        .single()

      if (fetchError || !book) {
        // Book row was deleted — skip silently, nothing to restore.
        result.failures.push({
          book_id: bucket.book_id,
          reason: fetchError?.message || 'book not found',
        })
        continue
      }

      // Compute new values
      const newCopies = Math.max(0, (book.copies ?? 0)) + bucket.qty
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const condCopies = (book.condition_copies || {}) as Record<string, any>
      if (bucket.condition && typeof condCopies === 'object') {
        const current = Number(condCopies[bucket.condition] ?? 0)
        condCopies[bucket.condition] = current + bucket.qty
      }
      const newStatus = newCopies > 0 ? 'available' : book.status

      // One targeted UPDATE per book
      const { error: updateError } = await supabaseAdmin
        .from('books')
        .update({
          copies: newCopies,
          status: newStatus,
          condition_copies: bucket.condition ? condCopies : book.condition_copies,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bucket.book_id)

      if (updateError) {
        result.failures.push({ book_id: bucket.book_id, reason: updateError.message })
        continue
      }

      result.restoredCount += bucket.qty
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      result.failures.push({ book_id: bucket.book_id, reason: message })
    }
  }

  return result
}
