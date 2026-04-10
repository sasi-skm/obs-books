import { supabase } from './supabase'

/**
 * Fetch wrapper that includes the Supabase auth token for admin API routes.
 * Use this instead of plain fetch() when calling /api/admin/* endpoints.
 */
export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(url, { ...options, headers })
}
