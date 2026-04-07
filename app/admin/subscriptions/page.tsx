'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { SUBSCRIPTION_BENEFITS } from '@/lib/subscription-pricing'

type AdminTab = 'subscribers' | 'letters' | 'payments'

interface Sub {
  id: string
  email: string
  full_name: string
  plan: string
  subscriber_type: string
  status: string
  started_at: string
  expires_at: string
  amount_paid: number
  currency: string
  country: string
}

interface SubPayment {
  id: string
  subscription_id: string
  amount: number
  currency: string
  payment_method: string
  slip_url: string | null
  status: string
  created_at: string
  subscriptions: { email: string; full_name: string; plan: string } | null
}

interface FlowerLetter {
  id: string
  title: string
  edition: string | null
  month: number | null
  year: number | null
  pdf_url: string | null
  thai_pdf_url: string | null
  sent_at: string | null
  recipient_count: number
  created_at: string
}

interface LotteryEntry {
  id: string
  user_id: string
  month: number
  year: number
  winner: boolean
  created_at: string
  profiles: { full_name: string; email: string } | null
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function planLabel(plan: string) {
  return plan === 'monthly' ? 'Monthly' : plan === '6months' ? '6 Months' : '1 Year'
}

export default function AdminSubscriptionsPage() {
  const [tab, setTab] = useState<AdminTab>('subscribers')

  // Subscribers
  const [subs, setSubs] = useState<Sub[]>([])
  const [subsLoading, setSubsLoading] = useState(true)
  const [subFilter, setSubFilter] = useState('all')

  // Payments
  const [payments, setPayments] = useState<SubPayment[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [payFilter, setPayFilter] = useState('all')

  // Letters
  const [letters, setLetters] = useState<FlowerLetter[]>([])
  const [lettersLoading, setLettersLoading] = useState(false)
  const [letterForm, setLetterForm] = useState({ title: '', edition: '', month: '', year: '' })
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [thaiPdfFile, setThaiPdfFile] = useState<File | null>(null)
  const [uploadingLetter, setUploadingLetter] = useState(false)
  const [letterMsg, setLetterMsg] = useState('')
  const [sendingLetter, setSendingLetter] = useState<string | null>(null)

  // Lottery
  const [lotteryWinner, setLotteryWinner] = useState<Sub | null>(null)
  const [lotteryHistory, setLotteryHistory] = useState<LotteryEntry[]>([])
  const [drawingLottery, setDrawingLottery] = useState(false)

  const loadSubs = useCallback(async () => {
    setSubsLoading(true)
    const { data } = await supabase.from('subscriptions').select('*').order('created_at', { ascending: false })
    if (data) setSubs(data as Sub[])
    setSubsLoading(false)
  }, [])

  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true)
    const { data } = await supabase
      .from('subscription_payments')
      .select('*, subscriptions(email, full_name, plan)')
      .order('created_at', { ascending: false })
    if (data) setPayments(data as SubPayment[])
    setPaymentsLoading(false)
  }, [])

  const loadLetters = useCallback(async () => {
    setLettersLoading(true)
    const { data } = await supabase.from('flower_letters').select('*').order('created_at', { ascending: false })
    if (data) setLetters(data as FlowerLetter[])
    setLettersLoading(false)
  }, [])

  const loadLotteryHistory = useCallback(async () => {
    const { data } = await supabase
      .from('lottery_entries')
      .select('*, profiles(full_name, email)')
      .eq('winner', true)
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) setLotteryHistory(data as LotteryEntry[])
  }, [])

  useEffect(() => { loadSubs(); loadLotteryHistory() }, [loadSubs, loadLotteryHistory])
  useEffect(() => { if (tab === 'payments') loadPayments() }, [tab, loadPayments])
  useEffect(() => { if (tab === 'letters') loadLetters() }, [tab, loadLetters])

  const activeSubs = subs.filter(s => s.status === 'active' && new Date(s.expires_at) > new Date())
  const activeCount = activeSubs.length
  const thaiCount = activeSubs.filter(s => s.subscriber_type === 'thai').length
  const intlCount = activeSubs.filter(s => s.subscriber_type === 'international').length

  const filteredSubs = subs.filter(s => {
    if (subFilter === 'active') return s.status === 'active'
    if (subFilter === 'expired') return s.status === 'expired'
    if (subFilter === 'cancelled') return s.status === 'cancelled'
    if (subFilter === 'thai') return s.subscriber_type === 'thai'
    if (subFilter === 'international') return s.subscriber_type === 'international'
    return true
  })

  const filteredPayments = payments.filter(p => {
    if (payFilter === 'pending') return p.status === 'pending'
    if (payFilter === 'confirmed') return p.status === 'confirmed'
    return true
  })

  const handleConfirmPayment = async (paymentId: string, subId: string) => {
    await supabase.from('subscription_payments').update({ status: 'confirmed' }).eq('id', paymentId)
    await supabase.from('subscriptions').update({ status: 'active' }).eq('id', subId)
    loadPayments()
    loadSubs()
  }

  const handleCancelSub = async (id: string) => {
    if (!confirm('Cancel this subscription?')) return
    await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('id', id)
    loadSubs()
  }

  const handleUploadLetter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pdfFile || !letterForm.title) return
    setUploadingLetter(true)
    setLetterMsg('')
    try {
      const uploadFile = async (file: File, prefix: string) => {
        const ext = file.name.split('.').pop() || 'pdf'
        const name = `${prefix}-${Date.now()}.${ext}`
        const { error } = await supabase.storage.from('flower-letters').upload(name, file, { contentType: file.type })
        if (error) throw error
        const { data: { publicUrl } } = supabase.storage.from('flower-letters').getPublicUrl(name)
        return publicUrl
      }

      const pdfUrl = await uploadFile(pdfFile, 'letter')
      const thaiPdfUrl = thaiPdfFile ? await uploadFile(thaiPdfFile, 'letter-thai') : null

      await supabase.from('flower_letters').insert({
        title: letterForm.title,
        edition: letterForm.edition || null,
        month: letterForm.month ? parseInt(letterForm.month) : null,
        year: letterForm.year ? parseInt(letterForm.year) : null,
        pdf_url: pdfUrl,
        thai_pdf_url: thaiPdfUrl,
      })

      setLetterMsg('Letter uploaded successfully')
      setLetterForm({ title: '', edition: '', month: '', year: '' })
      setPdfFile(null)
      setThaiPdfFile(null)
      loadLetters()
    } catch (err) {
      setLetterMsg('Upload failed: ' + (err instanceof Error ? err.message : String(err)))
    }
    setUploadingLetter(false)
  }

  const handleSendLetter = async (letter: FlowerLetter) => {
    if (!confirm(`Send this letter to all active international subscribers?`)) return
    setSendingLetter(letter.id)
    try {
      const intlActiveSubs = activeSubs.filter(s => s.subscriber_type === 'international')
      const now = new Date()
      const monthName = letter.month ? MONTH_NAMES[letter.month - 1] : MONTH_NAMES[now.getMonth()]
      const yr = letter.year || now.getFullYear()

      let sent = 0
      for (const sub of intlActiveSubs) {
        try {
          const res = await fetch('/api/subscriptions/send-letter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: sub.email,
              name: sub.full_name || sub.email.split('@')[0],
              month: monthName,
              year: yr,
              pdfUrl: letter.pdf_url,
            }),
          })
          if (res.ok) sent++
        } catch {}
      }

      await supabase.from('flower_letters').update({ sent_at: now.toISOString(), recipient_count: sent }).eq('id', letter.id)
      setLetterMsg(`Sent to ${sent} international subscriber${sent !== 1 ? 's' : ''}`)
      loadLetters()
    } catch (err) {
      setLetterMsg('Send failed: ' + (err instanceof Error ? err.message : String(err)))
    }
    setSendingLetter(null)
  }

  const handleMarkSent = async (id: string) => {
    await supabase.from('flower_letters').update({ sent_at: new Date().toISOString() }).eq('id', id)
    loadLetters()
  }

  const handleDrawLottery = () => {
    if (activeSubs.length === 0) return
    setDrawingLottery(true)
    setTimeout(() => {
      const winner = activeSubs[Math.floor(Math.random() * activeSubs.length)]
      setLotteryWinner(winner)
      setDrawingLottery(false)
    }, 800)
  }

  const handleConfirmWinner = async () => {
    if (!lotteryWinner) return
    const now = new Date()
    await supabase.from('lottery_entries').insert({
      subscription_id: lotteryWinner.id,
      user_id: null,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      winner: true,
    })
    try {
      const { sendTelegramLotteryWinner } = await import('@/lib/telegram')
      await sendTelegramLotteryWinner({ name: lotteryWinner.full_name || lotteryWinner.email, email: lotteryWinner.email })
    } catch {}
    setLotteryWinner(null)
    loadLotteryHistory()
    alert(`Winner confirmed: ${lotteryWinner.full_name || lotteryWinner.email}`)
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-normal mb-2">Subscriptions</h1>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Active Subscribers', value: activeCount, color: '#4a6741' },
          { label: 'Thai', value: thaiCount, color: '#6b5e48' },
          { label: 'International', value: intlCount, color: '#6b5e48' },
        ].map(s => (
          <div key={s.label} className="bg-offwhite border border-line p-4 text-center">
            <p className="font-heading text-2xl font-normal" style={{ color: s.color }}>{s.value}</p>
            <p className="font-body text-xs text-ink-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Lottery threshold */}
      <div className="mb-6 p-4 border border-line bg-offwhite">
        {activeCount >= SUBSCRIPTION_BENEFITS.lottery_threshold ? (
          <p className="font-heading text-sm text-sage">
            🎉 Lottery active — {activeCount} eligible subscribers this month
          </p>
        ) : (
          <div>
            <p className="font-heading text-sm text-ink-light mb-2">
              {activeCount}/{SUBSCRIPTION_BENEFITS.lottery_threshold} subscribers — {SUBSCRIPTION_BENEFITS.lottery_threshold - activeCount} more until the monthly lottery begins
            </p>
            <div className="w-full h-2 bg-line rounded-full overflow-hidden">
              <div className="h-full bg-sage rounded-full transition-all" style={{ width: `${(activeCount / SUBSCRIPTION_BENEFITS.lottery_threshold) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line mb-6">
        {(['subscribers', 'letters', 'payments'] as AdminTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`font-heading text-sm px-5 py-2.5 border-b-2 -mb-px capitalize transition-colors ${tab === t ? 'border-sage text-sage' : 'border-transparent text-ink-muted hover:text-ink'}`}>
            {t === 'letters' ? 'Flower Letters' : t === 'payments' ? 'Payments' : 'Subscribers'}
          </button>
        ))}
      </div>

      {/* ── Subscribers Tab ─────────────────────────────────────────────── */}
      {tab === 'subscribers' && (
        <div>
          {/* Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            {['all','active','expired','cancelled','thai','international'].map(f => (
              <button key={f} onClick={() => setSubFilter(f)}
                className={`px-3 py-1 font-heading text-xs capitalize border transition-colors ${subFilter === f ? 'border-sage bg-sage/10 text-sage' : 'border-line text-ink-muted hover:border-sage'}`}>
                {f}
              </button>
            ))}
          </div>

          {subsLoading ? (
            <p className="text-ink-muted text-sm">Loading...</p>
          ) : filteredSubs.length === 0 ? (
            <p className="text-ink-muted text-sm italic">No subscribers found</p>
          ) : (
            <div className="bg-offwhite border border-line overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-parchment">
                    <th className="text-left p-3 font-heading font-medium text-xs">Name / Email</th>
                    <th className="text-left p-3 font-heading font-medium text-xs">Plan</th>
                    <th className="text-left p-3 font-heading font-medium text-xs">Type</th>
                    <th className="text-left p-3 font-heading font-medium text-xs">Status</th>
                    <th className="text-left p-3 font-heading font-medium text-xs">Expires</th>
                    <th className="text-left p-3 font-heading font-medium text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.map(s => (
                    <tr key={s.id} className="border-b border-line hover:bg-parchment/50">
                      <td className="p-3">
                        <p className="font-medium text-ink">{s.full_name || '-'}</p>
                        <p className="text-xs text-ink-muted">{s.email}</p>
                      </td>
                      <td className="p-3 text-ink-light">{planLabel(s.plan)}</td>
                      <td className="p-3 capitalize text-ink-light">{s.subscriber_type}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 ${
                          s.status === 'active' ? 'bg-sage/10 text-sage' :
                          s.status === 'expired' ? 'bg-line/30 text-ink-muted' :
                          'bg-rose/10 text-rose'
                        }`}>{s.status}</span>
                      </td>
                      <td className="p-3 text-xs text-ink-muted">
                        {new Date(s.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {s.status === 'active' && (
                            <button onClick={() => handleCancelSub(s.id)}
                              className="text-xs px-2 py-1 border border-rose text-rose hover:bg-rose hover:text-white transition-colors">
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Lottery panel */}
          {activeCount >= SUBSCRIPTION_BENEFITS.lottery_threshold && (
            <div className="mt-8 p-6 border border-sage/30 bg-offwhite">
              <h2 className="font-heading text-lg font-normal mb-4">🎉 Monthly Lottery</h2>
              <p className="text-sm text-ink-light mb-4">{activeCount} eligible subscribers this month</p>

              {!lotteryWinner ? (
                <button onClick={handleDrawLottery} disabled={drawingLottery}
                  className="px-5 py-2.5 bg-sage text-offwhite font-heading text-sm hover:bg-sage-light disabled:opacity-50">
                  {drawingLottery ? 'Drawing...' : 'Draw Winner'}
                </button>
              ) : (
                <div className="p-5 border border-sage bg-sage/5 mb-4">
                  <p className="font-heading text-sm text-sage mb-1">This month&apos;s winner:</p>
                  <p className="font-heading text-xl">{lotteryWinner.full_name || 'Anonymous'}</p>
                  <p className="text-sm text-ink-muted">{lotteryWinner.email}</p>
                  <p className="text-xs text-ink-muted mt-1 capitalize">{lotteryWinner.subscriber_type} subscriber · {planLabel(lotteryWinner.plan)}</p>
                  <div className="flex gap-3 mt-4">
                    <button onClick={handleConfirmWinner} className="px-4 py-2 bg-sage text-offwhite font-heading text-xs hover:bg-sage-light">
                      Confirm Winner
                    </button>
                    <button onClick={() => setLotteryWinner(null)} className="px-4 py-2 border border-line text-ink-muted font-heading text-xs hover:border-rose hover:text-rose transition-colors">
                      Draw Again
                    </button>
                  </div>
                </div>
              )}

              {lotteryHistory.length > 0 && (
                <div className="mt-6">
                  <p className="font-heading text-sm text-ink-muted mb-3">Past Winners</p>
                  <div className="space-y-2">
                    {lotteryHistory.map(e => (
                      <div key={e.id} className="flex justify-between text-sm border-b border-line pb-2">
                        <span className="text-ink">{e.profiles?.full_name || 'Anonymous'} — {e.profiles?.email}</span>
                        <span className="text-ink-muted">{MONTH_NAMES[e.month - 1]} {e.year}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Flower Letters Tab ──────────────────────────────────────────── */}
      {tab === 'letters' && (
        <div>
          {/* Upload form */}
          <div className="bg-offwhite border border-line p-5 mb-8 max-w-xl">
            <h2 className="font-heading text-base mb-4">Upload New Letter</h2>
            {letterMsg && (
              <p className={`text-sm mb-3 ${letterMsg.includes('fail') ? 'text-rose' : 'text-sage'}`}>{letterMsg}</p>
            )}
            <form onSubmit={handleUploadLetter} className="space-y-3">
              <div>
                <label className="block font-heading text-xs mb-1">Title *</label>
                <input className="w-full px-3 py-2 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                  value={letterForm.title} onChange={e => setLetterForm({ ...letterForm, title: e.target.value })} required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-heading text-xs mb-1">Edition</label>
                  <input className="w-full px-3 py-2 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                    placeholder="No.1" value={letterForm.edition} onChange={e => setLetterForm({ ...letterForm, edition: e.target.value })} />
                </div>
                <div>
                  <label className="block font-heading text-xs mb-1">Month</label>
                  <select className="w-full px-3 py-2 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                    value={letterForm.month} onChange={e => setLetterForm({ ...letterForm, month: e.target.value })}>
                    <option value="">-</option>
                    {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-heading text-xs mb-1">Year</label>
                  <input type="number" className="w-full px-3 py-2 border border-line bg-cream font-body text-sm outline-none focus:border-sage"
                    placeholder={String(new Date().getFullYear())} value={letterForm.year} onChange={e => setLetterForm({ ...letterForm, year: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block font-heading text-xs mb-1">PDF (International) *</label>
                <input type="file" accept=".pdf,application/pdf" className="w-full text-sm text-ink-muted file:mr-3 file:py-1.5 file:px-3 file:border file:border-line file:text-xs file:font-heading file:bg-cream file:text-ink hover:file:bg-parchment"
                  onChange={e => setPdfFile(e.target.files?.[0] || null)} required />
              </div>
              <div>
                <label className="block font-heading text-xs mb-1">Thai PDF (optional)</label>
                <input type="file" accept=".pdf,application/pdf" className="w-full text-sm text-ink-muted file:mr-3 file:py-1.5 file:px-3 file:border file:border-line file:text-xs file:font-heading file:bg-cream file:text-ink hover:file:bg-parchment"
                  onChange={e => setThaiPdfFile(e.target.files?.[0] || null)} />
              </div>
              <button type="submit" disabled={uploadingLetter}
                className="px-5 py-2 bg-sage text-offwhite font-heading text-sm hover:bg-sage-light disabled:opacity-50">
                {uploadingLetter ? 'Uploading...' : 'Upload Letter'}
              </button>
            </form>
          </div>

          {/* Letters list */}
          {lettersLoading ? (
            <p className="text-ink-muted text-sm">Loading...</p>
          ) : letters.length === 0 ? (
            <p className="text-ink-muted text-sm italic">No letters uploaded yet</p>
          ) : (
            <div className="space-y-3">
              {letters.map(l => (
                <div key={l.id} className="flex items-center gap-4 p-4 bg-offwhite border border-line">
                  <div className="flex-1">
                    <p className="font-heading text-sm text-ink">{l.title}</p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {l.edition && `${l.edition} · `}
                      {l.month && l.year ? `${MONTH_NAMES[l.month - 1]} ${l.year}` : ''}
                      {l.sent_at ? ` · Sent to ${l.recipient_count} subscribers` : ' · Not sent yet'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {l.pdf_url && (
                      <a href={l.pdf_url} target="_blank" rel="noopener noreferrer"
                        className="px-3 py-1.5 border border-line text-ink-muted text-xs font-heading hover:border-sage hover:text-sage transition-colors">
                        View PDF
                      </a>
                    )}
                    {!l.sent_at && l.pdf_url && (
                      <button onClick={() => handleSendLetter(l)} disabled={sendingLetter === l.id}
                        className="px-3 py-1.5 bg-sage text-offwhite text-xs font-heading hover:bg-sage-light disabled:opacity-50">
                        {sendingLetter === l.id ? 'Sending...' : `Send to Intl (${intlCount})`}
                      </button>
                    )}
                    {!l.sent_at && (
                      <button onClick={() => handleMarkSent(l.id)}
                        className="px-3 py-1.5 border border-sage text-sage text-xs font-heading hover:bg-sage/10">
                        Mark Sent
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Payments Tab ────────────────────────────────────────────────── */}
      {tab === 'payments' && (
        <div>
          <div className="flex gap-2 mb-4">
            {['all','pending','confirmed'].map(f => (
              <button key={f} onClick={() => setPayFilter(f)}
                className={`px-3 py-1 font-heading text-xs capitalize border transition-colors ${payFilter === f ? 'border-sage bg-sage/10 text-sage' : 'border-line text-ink-muted hover:border-sage'}`}>
                {f}
              </button>
            ))}
          </div>

          {paymentsLoading ? (
            <p className="text-ink-muted text-sm">Loading...</p>
          ) : filteredPayments.length === 0 ? (
            <p className="text-ink-muted text-sm italic">No payments found</p>
          ) : (
            <div className="bg-offwhite border border-line overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-parchment">
                    <th className="text-left p-3 font-heading font-medium text-xs">Subscriber</th>
                    <th className="text-left p-3 font-heading font-medium text-xs">Plan</th>
                    <th className="text-left p-3 font-heading font-medium text-xs">Amount</th>
                    <th className="text-left p-3 font-heading font-medium text-xs">Method</th>
                    <th className="text-left p-3 font-heading font-medium text-xs">Slip</th>
                    <th className="text-left p-3 font-heading font-medium text-xs">Status</th>
                    <th className="text-left p-3 font-heading font-medium text-xs">Date</th>
                    <th className="text-left p-3 font-heading font-medium text-xs">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map(p => (
                    <tr key={p.id} className="border-b border-line hover:bg-parchment/50">
                      <td className="p-3">
                        <p className="font-medium text-ink">{p.subscriptions?.full_name || '-'}</p>
                        <p className="text-xs text-ink-muted">{p.subscriptions?.email}</p>
                      </td>
                      <td className="p-3 text-ink-light text-xs">{planLabel(p.subscriptions?.plan || '')}</td>
                      <td className="p-3 font-medium text-bark">
                        {p.currency === 'THB' ? '฿' : '$'}{Number(p.amount).toLocaleString()}
                      </td>
                      <td className="p-3 text-ink-light text-xs capitalize">{p.payment_method?.replace('_', ' ')}</td>
                      <td className="p-3">
                        {p.slip_url ? (
                          <a href={p.slip_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-sage underline underline-offset-2">View</a>
                        ) : <span className="text-xs text-ink-muted">-</span>}
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 ${p.status === 'confirmed' ? 'bg-sage/10 text-sage' : p.status === 'failed' ? 'bg-rose/10 text-rose' : 'bg-amber-50 text-amber-700'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-ink-muted">
                        {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="p-3">
                        {p.status === 'pending' && (
                          <button onClick={() => handleConfirmPayment(p.id, p.subscription_id)}
                            className="text-xs px-2 py-1 bg-sage text-offwhite hover:bg-sage-light">
                            Confirm
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
