import { NextRequest, NextResponse } from 'next/server'

async function getAdmin() {
  const { supabaseAdmin } = await import('@/lib/supabase-server')
  return supabaseAdmin
}

// GET /api/admin/reviews?status=pending|all
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdmin()
    const status = req.nextUrl.searchParams.get('status') || 'all'

    let query = admin
      .from('reviews')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })

    if (status === 'pending') {
      query = query.eq('status', 'pending')
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json(data || [])
  } catch (err) {
    console.error('Admin reviews GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

// PATCH /api/admin/reviews - approve or hide a review
export async function PATCH(req: NextRequest) {
  try {
    const admin = await getAdmin()
    const { id, action } = await req.json() // action: 'approve' | 'hide'

    if (!id || !['approve', 'hide'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const newStatus = action === 'approve' ? 'approved' : 'hidden'

    // Get the review first
    const { data: review, error: reviewError } = await admin
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Update status
    await admin.from('reviews').update({ status: newStatus }).eq('id', id)

    // Award points if approving and not yet awarded
    if (action === 'approve' && !review.points_awarded && review.user_id) {
      const hasPhotos = review.photo_urls && review.photo_urls.length > 0
      const points = hasPhotos ? 50 : 20
      const type = hasPhotos ? 'earned_photo' : 'earned_review'

      // Update profile points balance
      const { data: profile } = await admin
        .from('profiles')
        .select('points_balance')
        .eq('id', review.user_id)
        .single()

      const currentBalance = profile?.points_balance || 0

      await admin
        .from('profiles')
        .update({ points_balance: currentBalance + points })
        .eq('id', review.user_id)

      // Insert points transaction
      await admin.from('points_transactions').insert({
        user_id: review.user_id,
        points,
        type,
        reference_id: review.id,
        book_title: review.book_title,
      })

      // Mark points awarded
      await admin.from('reviews').update({ points_awarded: true }).eq('id', id)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin reviews PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
  }
}

// DELETE /api/admin/reviews
export async function DELETE(req: NextRequest) {
  try {
    const admin = await getAdmin()
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    await admin.from('reviews').delete().eq('id', id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin reviews DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
  }
}
