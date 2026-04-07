'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Book } from '@/types'
import { supabase } from '@/lib/supabase'
import { SAMPLE_BOOKS } from '@/lib/books-data'

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBooks()
  }, [])

  const loadBooks = async () => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      try {
        const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false })
        if (data && data.length > 0) {
          setBooks(data as Book[])
          setLoading(false)
          return
        }
      } catch {}
    }
    setBooks(SAMPLE_BOOKS)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this book?')) return

    const book = books.find(b => b.id === id)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      const res = await fetch('/api/admin/delete-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, category: book?.category }),
      })
      if (!res.ok) {
        const text = await res.text()
        try { const d = JSON.parse(text); alert('Failed to delete: ' + d.error) } catch { alert('Failed to delete. Please try again.') }
        return
      }
    }
    setBooks(prev => prev.filter(b => b.id !== id))
  }

  const filtered = books.filter(b => {
    if (!search) return true
    const q = search.toLowerCase()
    return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-heading text-2xl font-normal">Books ({books.length})</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/books/import"
            className="px-4 py-2 border border-sage text-sage font-heading text-sm hover:bg-sage/10 transition-colors"
          >
            Import CSV
          </Link>
          <Link
            href="/admin/books/new"
            className="px-4 py-2 bg-sage text-offwhite font-heading text-sm hover:bg-sage-light transition-colors"
          >
            + Add Book
          </Link>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search books..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2.5 border border-line bg-offwhite font-body text-sm outline-none focus:border-sage mb-6"
      />

      {loading ? (
        <p className="text-ink-muted">Loading...</p>
      ) : (
        <div>
          {/* Mobile: card layout */}
          <div className="md:hidden space-y-2">
            {filtered.map(book => (
              <div key={book.id} className="bg-offwhite border border-line p-3 flex gap-3 items-center">
                <div className="w-12 h-12 relative flex-shrink-0">
                  <Image src={book.image_url} alt="" fill className="object-cover" sizes="48px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-medium text-sm truncate">{book.title}</p>
                  <p className="text-xs text-ink-muted truncate">{book.author}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-heading text-xs text-bark">฿{book.price.toLocaleString()}</span>
                    <span className={`text-[0.6rem] px-1.5 py-0.5 ${
                      book.status === 'available' ? 'bg-sage/10 text-sage' : 'bg-rose/10 text-rose'
                    }`}>{book.status}</span>
                    <span className="text-[0.6rem] text-ink-muted">{book.copies} copies</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <Link href={`/admin/books/${book.id}`} className="text-xs text-sage hover:text-sage-light underline">
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(book.id)} className="text-xs text-rose hover:text-rose/80 underline">
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center py-8 text-ink-muted italic">No books found</p>
            )}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden md:block bg-offwhite border border-line overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-parchment">
                  <th className="text-left p-3 font-heading font-medium">Photo</th>
                  <th className="text-left p-3 font-heading font-medium">Title</th>
                  <th className="text-left p-3 font-heading font-medium">Author</th>
                  <th className="text-left p-3 font-heading font-medium">Price</th>
                  <th className="text-left p-3 font-heading font-medium">Copies</th>
                  <th className="text-left p-3 font-heading font-medium">Status</th>
                  <th className="text-left p-3 font-heading font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(book => (
                  <tr key={book.id} className="border-b border-line hover:bg-parchment/50">
                    <td className="p-3">
                      <div className="w-10 h-10 relative">
                        <Image src={book.image_url} alt="" fill className="object-cover" sizes="40px" />
                      </div>
                    </td>
                    <td className="p-3 font-heading font-medium max-w-[200px] truncate">{book.title}</td>
                    <td className="p-3 text-ink-muted">{book.author}</td>
                    <td className="p-3 font-heading text-bark">฿{book.price.toLocaleString()}</td>
                    <td className="p-3">{book.copies}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 ${
                        book.status === 'available' ? 'bg-sage/10 text-sage' : 'bg-rose/10 text-rose'
                      }`}>
                        {book.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Link href={`/admin/books/${book.id}`} className="text-xs text-sage hover:text-sage-light underline">
                          Edit
                        </Link>
                        <button onClick={() => handleDelete(book.id)} className="text-xs text-rose hover:text-rose/80 underline">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center py-8 text-ink-muted italic">No books found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
