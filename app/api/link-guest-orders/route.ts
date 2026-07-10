import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { rateLimit } from '@/lib/rate-limit'

/**
 * Attach a new account to the guest orders that were placed with its email.
 *
 * This used to run in the browser, from app/signup/page.tsx:
 *
 *   supabase.from('orders').update({ user_id }).eq('customer_email', email)
 *
 * which only worked because of the `orders_user_update_own` RLS policy. That
 * policy also let any signed-in customer PATCH their own order row directly
 * with the anon key, setting payment_status='confirmed' or total_amount=1.
 * supabase/harden-orders-rls.sql drops it, so the linking has to move here,
 * behind the service-role key, or every new account would silently lose its
 * order history and the loyalty points hanging off it.
 *
 * The email is taken from the verified session, never from the request body:
 * otherwise anyone could claim a stranger's guest orders by signing up and
 * posting their address.
 */
export async function POST(req: NextRequest) {
  const rl = await rateLimit(req, { id: 'link-guest-orders', limit: 5, windowMs: 60_000 })
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  )

  const { data, error } = await supabase.auth.getUser()
  const user = data?.user
  if (error || !user?.id || !user.email) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  // Supabase only populates `email_confirmed_at` once the address is verified.
  // Without that check a signup with somebody else's email could adopt their
  // guest orders before the real owner ever saw a confirmation mail.
  if (!user.email_confirmed_at) {
    return NextResponse.json({ linked: 0, pending_verification: true })
  }

  const { supabaseAdmin } = await import('@/lib/supabase-server')
  const { data: linked, error: updateError } = await supabaseAdmin
    .from('orders')
    .update({ user_id: user.id })
    .eq('customer_email', user.email)
    .is('user_id', null)
    .select('id')

  if (updateError) {
    console.error('[link-guest-orders] update failed:', updateError)
    return NextResponse.json({ error: 'Could not link orders' }, { status: 500 })
  }

  return NextResponse.json({ linked: linked?.length ?? 0 })
}
