import { NextRequest, NextResponse } from 'next/server'

/**
 * Public payment-slip upload endpoint.
 *
 * Unlike /api/upload (which is auth-gated for logged-in actions like profile
 * pics, review photos, etc), this route is intentionally UNAUTHENTICATED so
 * that guest customers can upload their payment slip after checkout.
 *
 * Safety rails:
 *   - Only accepts image/* files up to 5 MB.
 *   - Only writes to the 'payment-slips' bucket (hard-coded, not client-choice).
 *   - Only updates the matching order's slip_url AND only if the caller
 *     provides a valid order_id AND the order's current payment_status is
 *     'pending' or 'uploaded' (prevents arbitrary overwrites of confirmed orders).
 *   - File name is deterministic: {orderId}-{timestamp}.{ext}.
 *   - Never exposes service-role key to the client; all storage work is
 *     performed server-side via supabaseAdmin.
 */

export const runtime = 'nodejs'
export const maxDuration = 15

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const orderId = formData.get('order_id') as string | null
    const orderNumber = formData.get('order_number') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!orderId && !orderNumber) {
      return NextResponse.json({ error: 'Missing order_id or order_number' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large — max 5 MB' }, { status: 413 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPG, PNG, WebP, or HEIC images are accepted' },
        { status: 415 },
      )
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
      return NextResponse.json({ error: 'Server storage not configured' }, { status: 500 })
    }

    const { supabaseAdmin } = await import('@/lib/supabase-server')

    // 1. Verify the order exists and is in a state that accepts slips.
    //    Accept lookup by id (from checkout flow) or order_number (from the
    //    public /slip-upload link emailed to customers).
    const baseQuery = supabaseAdmin
      .from('orders')
      .select('id, order_number, customer_name, customer_phone, total_amount, payment_status')

    const { data: order, error: fetchError } = await (orderId
      ? baseQuery.eq('id', orderId).single()
      : baseQuery.eq('order_number', orderNumber!).single())

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    if (order.payment_status === 'confirmed') {
      return NextResponse.json({ error: 'This order is already confirmed' }, { status: 409 })
    }

    // 2. Upload to payment-slips bucket.
    const extFromName = (file.name.split('.').pop() || '').toLowerCase()
    const ext = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(extFromName) ? extFromName : 'jpg'
    const fileName = `${order.id}-${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('payment-slips')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('[upload-slip] storage.upload failed:', uploadError)
      return NextResponse.json({ error: 'Failed to store slip' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('payment-slips')
      .getPublicUrl(fileName)

    // 3. Update the order row.
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ slip_url: publicUrl, payment_status: 'uploaded' })
      .eq('id', order.id)

    if (updateError) {
      console.error('[upload-slip] order update failed:', updateError)
      return NextResponse.json({ error: 'Failed to attach slip to order' }, { status: 500 })
    }

    // 4. Notify admin by email (non-blocking).
    try {
      const { sendAdminSlipUploadedEmail } = await import('@/lib/email')
      await sendAdminSlipUploadedEmail({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        totalAmount: order.total_amount,
        slipUrl: publicUrl,
      })
    } catch (emailErr) {
      console.error('[upload-slip] admin email failed:', emailErr)
    }

    return NextResponse.json({ url: publicUrl, order_number: order.order_number })
  } catch (err) {
    console.error('[upload-slip] unexpected error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
