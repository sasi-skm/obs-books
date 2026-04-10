'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import LinenForm from '@/components/admin/LinenForm'
import { Book } from '@/types'
import { supabase } from '@/lib/supabase'

export default function EditLinenPage() {
  const params = useParams()
  const id = params.id as string
  const [linen, setLinen] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const { data, error } = await supabase.from('books').select('*').eq('id', id).single()
        if (cancelled) return
        if (error || !data) {
          setNotFound(true)
        } else {
          setLinen(data as Book)
        }
      } catch {
        if (!cancelled) setNotFound(true)
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <p className="text-ink-muted">Loading...</p>
  if (notFound || !linen) return <p className="text-ink-muted">Linen not found.</p>

  return <LinenForm linen={linen} />
}
