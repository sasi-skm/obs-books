import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * A tiny in-memory stand-in for the supabase-js query builder, covering
 * exactly the chains lib/order-pricing.ts uses:
 *
 *   .from(t).select(...).in(col, vals)          -> awaited (thenable)
 *   .from(t).select(...).eq().eq().single()
 *   .from(t).select(...).eq().neq().limit(n)
 *   .from(t).select(...).eq().single()
 *
 * Filters apply in-memory over the rows given per table. `.single()`
 * mirrors supabase-js: errors unless exactly one row matches.
 */
export function fakeSupabase(
  tables: Record<string, Record<string, unknown>[]>,
): SupabaseClient {
  return {
    from(table: string) {
      const filters: Array<(r: Record<string, unknown>) => boolean> = []
      const apply = () =>
        (tables[table] ?? []).filter(r => filters.every(f => f(r)))

      const api = {
        select() {
          return api
        },
        in(col: string, vals: unknown[]) {
          filters.push(r => vals.includes(r[col]))
          return api
        },
        eq(col: string, val: unknown) {
          filters.push(r => r[col] === val)
          return api
        },
        neq(col: string, val: unknown) {
          filters.push(r => r[col] !== val)
          return api
        },
        limit(n: number) {
          return Promise.resolve({ data: apply().slice(0, n), error: null })
        },
        single() {
          const rows = apply()
          return rows.length === 1
            ? Promise.resolve({ data: rows[0], error: null })
            : Promise.resolve({
                data: null,
                error: { message: `expected 1 row, got ${rows.length}` },
              })
        },
        // Awaiting the builder itself (no .single()/.limit()) resolves
        // with all matching rows, like supabase-js.
        then(
          resolve: (v: { data: unknown; error: null }) => unknown,
          reject?: (e: unknown) => unknown,
        ) {
          return Promise.resolve({ data: apply(), error: null }).then(resolve, reject)
        },
      }
      return api
    },
  } as unknown as SupabaseClient
}
