import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Protect with CRON_SECRET
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const { supabaseAdmin } = await import('@/lib/supabase-server')
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // End of current month for voucher expiry
  const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59)

  try {
    // Find active subscribers with birthdays this month who haven't received discount yet
    const { data: subs } = await supabaseAdmin
      .from('subscriptions')
      .select('id, user_id, email, full_name, birthday_discount_month')
      .eq('status', 'active')
      .gt('expires_at', now.toISOString())

    if (!subs || subs.length === 0) return NextResponse.json({ processed: 0 })

    const userIds = subs.filter(s => s.user_id).map(s => s.user_id)

    // Fetch profiles with birthdays this month
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, date_of_birth')
      .in('id', userIds)

    const birthdayUserIds = new Set(
      (profiles || [])
        .filter(p => {
          if (!p.date_of_birth) return false
          const dob = new Date(p.date_of_birth)
          return dob.getMonth() + 1 === currentMonth
        })
        .map(p => p.id)
    )

    let processed = 0

    for (const sub of subs) {
      if (!sub.user_id || !birthdayUserIds.has(sub.user_id)) continue
      if (sub.birthday_discount_month === currentMonth) continue // already sent this month

      const code = `BDAY-${sub.user_id.slice(0, 8).toUpperCase()}-${currentYear}`

      // Insert voucher
      const { error: vErr } = await supabaseAdmin.from('vouchers').insert({
        code,
        discount_percent: 10,
        minimum_order: 0,
        first_order_only: false,
        active: true,
        expires_at: endOfMonth.toISOString(),
        single_use: true,
        user_id: sub.user_id,
      })

      if (vErr && !vErr.message.includes('unique')) {
        console.error('Voucher insert error:', vErr)
        continue
      }

      // Send birthday email
      try {
        const { sendBirthdayEmail } = await import('@/lib/email')
        await sendBirthdayEmail({
          to: sub.email,
          name: sub.full_name || sub.email.split('@')[0],
          code,
          expiresEnd: endOfMonth.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        })
      } catch (emailErr) {
        console.error('Birthday email failed:', emailErr)
      }

      // Mark discount sent
      await supabaseAdmin
        .from('subscriptions')
        .update({ birthday_discount_sent: true, birthday_discount_month: currentMonth })
        .eq('id', sub.id)

      processed++
    }

    return NextResponse.json({ processed })
  } catch (err) {
    console.error('Birthday check error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
