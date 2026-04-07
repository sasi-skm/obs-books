import { NextRequest, NextResponse } from 'next/server'

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const { supabaseAdmin } = await import('@/lib/supabase-server')
  const { sendRenewalReminderEmail, sendExpiryEmail } = await import('@/lib/email')
  const { sendTelegramSubscriptionExpired } = await import('@/lib/telegram')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const in7 = addDays(today, 7)
  const in1 = addDays(today, 1)

  try {
    const { data: subs } = await supabaseAdmin
      .from('subscriptions')
      .select('id, email, full_name, plan, expires_at, status')
      .eq('status', 'active')

    if (!subs) return NextResponse.json({ processed: 0 })

    let processed = 0

    for (const sub of subs) {
      const expires = new Date(sub.expires_at)
      expires.setHours(0, 0, 0, 0)
      const name = sub.full_name || sub.email.split('@')[0]
      const expiryStr = new Date(sub.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

      if (sameDay(expires, in7)) {
        // 7-day reminder
        try {
          await sendRenewalReminderEmail({ to: sub.email, name, expiresAt: expiryStr, daysLeft: 7 })
          processed++
        } catch (e) { console.error('7-day reminder failed:', e) }

      } else if (sameDay(expires, in1)) {
        // 1-day reminder
        try {
          await sendRenewalReminderEmail({ to: sub.email, name, expiresAt: expiryStr, daysLeft: 1 })
          processed++
        } catch (e) { console.error('1-day reminder failed:', e) }

      } else if (sameDay(expires, today)) {
        // Expired today
        await supabaseAdmin.from('subscriptions').update({ status: 'expired' }).eq('id', sub.id)

        try {
          await sendExpiryEmail({ to: sub.email, name })
          processed++
        } catch (e) { console.error('Expiry email failed:', e) }

        try {
          await sendTelegramSubscriptionExpired({ name, plan: sub.plan })
        } catch {}
      }
    }

    return NextResponse.json({ processed })
  } catch (err) {
    console.error('Renewal reminders error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
