import { NextRequest, NextResponse } from 'next/server'
import { calcExpiresAt } from '@/lib/subscription-pricing'
import type { Plan } from '@/lib/subscription-pricing'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      user_id, email, full_name, plan, subscriber_type, payment_method,
      payment_reference, amount_paid, currency, country, slip_url,
      date_of_birth,
    } = body

    if (!email || !plan || !subscriber_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const { supabaseAdmin } = await import('@/lib/supabase-server')

    const expiresAt = calcExpiresAt(plan as Plan)
    const isPayPal = payment_method === 'paypal'

    // Create subscription
    const { data: sub, error: subErr } = await supabaseAdmin.from('subscriptions').insert({
      user_id: user_id || null,
      email,
      full_name,
      plan,
      subscriber_type,
      status: 'active',
      expires_at: expiresAt.toISOString(),
      payment_method,
      payment_reference: payment_reference || null,
      amount_paid,
      currency,
      country: country || null,
    }).select().single()

    if (subErr) throw subErr

    // Create payment record
    const now = new Date()
    await supabaseAdmin.from('subscription_payments').insert({
      subscription_id: sub.id,
      user_id: user_id || null,
      amount: amount_paid,
      currency,
      payment_method,
      payment_reference: payment_reference || null,
      slip_url: slip_url || null,
      status: isPayPal ? 'confirmed' : 'pending',
      period_start: now.toISOString(),
      period_end: expiresAt.toISOString(),
    })

    // Update profile date_of_birth if provided
    if (user_id && date_of_birth) {
      await supabaseAdmin.from('profiles').update({ date_of_birth }).eq('id', user_id)
    }

    // Send welcome email (non-blocking)
    try {
      const { sendWelcomeEmail } = await import('@/lib/email')
      await sendWelcomeEmail({
        to: email,
        name: full_name || email.split('@')[0],
        plan,
        expiresAt,
        subscriberType: subscriber_type,
      })
    } catch (emailErr) {
      console.error('Welcome email failed:', emailErr)
    }

    // Telegram notification (non-blocking)
    try {
      const { sendTelegramSubscriptionNotification } = await import('@/lib/telegram')
      await sendTelegramSubscriptionNotification({
        name: full_name || email,
        email,
        plan,
        type: subscriber_type,
      })
    } catch {}

    return NextResponse.json({ success: true, subscription_id: sub.id })
  } catch (err) {
    console.error('Subscription create error:', err)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
