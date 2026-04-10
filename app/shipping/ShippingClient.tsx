'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SUPPORTED_COUNTRIES, getShippingRate, DEFAULT_BOOK_WEIGHT } from '@/lib/shipping'

function SectionLabel({ text }: { text: string }) {
  return (
    <p className="text-xs uppercase tracking-[0.2em] text-moss font-medium mb-3">
      {text}
    </p>
  )
}

function StarDivider() {
  return (
    <p className="text-moss text-xs tracking-[0.3em] my-3 select-none">— ✦ —</p>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-sand">
      <button
        className="w-full text-left py-4 flex justify-between items-center gap-4"
        onClick={() => setOpen(!open)}
      >
        <span className="font-heading text-[1.05rem] text-ink">{q}</span>
        <span className="text-moss text-xl flex-shrink-0 leading-none">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <p className="pb-5 text-sm text-ink-light leading-relaxed pr-8">{a}</p>
      )}
    </div>
  )
}

export default function ShippingClient() {
  const [country, setCountry] = useState('US')
  const [books, setBooks] = useState(1)

  const totalGrams = books * DEFAULT_BOOK_WEIGHT
  const shippingUsd = getShippingRate(country, totalGrams)
  const isThailand = country === 'TH'

  return (
    <div className="bg-cream min-h-screen">

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center bg-parchment border-b border-sand">
        <SectionLabel text="OBS Books" />
        <h1 className="font-heading text-[clamp(2.5rem,5vw,4rem)] font-normal text-ink mb-4">
          Worldwide Shipping
        </h1>
        <StarDivider />
        <p className="text-ink-light max-w-lg mx-auto leading-relaxed text-sm">
          We ship worldwide via DHL Express. Every order is carefully packed and sent with full tracking — so your books arrive safely, wherever you are.
        </p>
      </section>

      {/* Main content */}
      <div className="max-w-[860px] mx-auto px-6 py-16 space-y-20">

        {/* Section 1 - Estimator */}
        <section>
          <SectionLabel text="Before you order" />
          <StarDivider />
          <h2 className="font-heading text-[clamp(1.8rem,3vw,2.4rem)] font-normal text-ink mb-3">
            Estimate Shipping Cost
          </h2>
          <p className="text-ink-light text-sm mb-8 leading-relaxed max-w-xl">
            Shipping rates vary by destination and package weight. Enter your country below to get an estimate before you order.
          </p>
          <div className="bg-parchment border border-sand p-7 sm:p-10">
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-moss mb-2">Destination Country</label>
                <select
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full px-4 py-3 border border-sand bg-cream text-ink text-sm outline-none focus:border-moss transition-colors"
                >
                  {SUPPORTED_COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-moss mb-2">Number of Books</label>
                <select
                  value={books}
                  onChange={e => setBooks(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-sand bg-cream text-ink text-sm outline-none focus:border-moss transition-colors"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'book' : 'books'} (~{n * DEFAULT_BOOK_WEIGHT}g)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="border-t border-sand pt-7 text-center">
              {isThailand ? (
                <div>
                  <p className="font-heading text-4xl text-moss mb-1">Free Shipping</p>
                  <p className="text-xs text-ink-muted uppercase tracking-widest mt-1">Within Thailand</p>
                </div>
              ) : shippingUsd !== null ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-moss mb-2">Estimated shipping cost</p>
                  <p className="font-heading text-5xl text-ink mb-1">
                    ${shippingUsd.toFixed(2)}
                    <span className="text-xl text-ink-muted font-normal ml-2">USD</span>
                  </p>
                  <p className="text-xs text-ink-muted mt-2">via DHL Express — estimate only, final cost confirmed at checkout</p>
                </div>
              ) : (
                <p className="text-ink-muted text-sm italic">Select a country above to see your estimate</p>
              )}
            </div>
          </div>
        </section>

        {/* Section 2 - How it works */}
        <section>
          <SectionLabel text="The process" />
          <StarDivider />
          <h2 className="font-heading text-[clamp(1.8rem,3vw,2.4rem)] font-normal text-ink mb-10">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-sand">
            {[
              { n: '01', title: 'Place your order', body: 'Browse, add to cart, and check out. We\'ll confirm your order by email.' },
              { n: '02', title: 'We pack your books', body: 'Each order is carefully packed to keep your books in perfect condition during transit.' },
              { n: '03', title: 'DHL picks up', body: 'We hand your parcel to DHL Express. Your tracking number is sent by email.' },
              { n: '04', title: 'Delivered to you', body: 'DHL delivers to your door. Most orders arrive within 5–10 business days.' },
            ].map(step => (
              <div key={step.n} className="bg-cream p-6">
                <p className="font-heading text-4xl text-sand mb-4 leading-none">{step.n}</p>
                <p className="font-heading text-base text-ink mb-2">{step.title}</p>
                <p className="text-sm text-ink-muted leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3 - Who pays */}
        <section>
          <SectionLabel text="Payment options" />
          <StarDivider />
          <h2 className="font-heading text-[clamp(1.8rem,3vw,2.4rem)] font-normal text-ink mb-10">
            Who Pays for Shipping?
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="border border-sand p-7 bg-cream">
              <span className="text-[0.6rem] uppercase tracking-widest text-moss font-medium px-2 py-0.5 border border-moss inline-block mb-5">
                Standard
              </span>
              <h3 className="font-heading text-xl text-ink mb-3">Pay at checkout</h3>
              <p className="text-sm text-ink-light leading-relaxed">
                Shipping cost is calculated at checkout based on your destination and order weight. Pay by card along with your order — simple and straightforward.
              </p>
            </div>
            <div className="border-2 border-moss p-7 bg-parchment">
              <span className="text-[0.6rem] uppercase tracking-widest text-cream font-medium px-2 py-0.5 bg-moss inline-block mb-5">
                DHL account holders
              </span>
              <h3 className="font-heading text-xl text-ink mb-3">Bill to your DHL account</h3>
              <p className="text-sm text-ink-light leading-relaxed">
                Have a DHL account? Select &quot;Bill to Receiver&quot; at checkout and enter your account number — shipping is billed directly to you by DHL. Ideal for frequent or business orders.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4 - Delivery times */}
        <section>
          <SectionLabel text="Delivery times" />
          <StarDivider />
          <h2 className="font-heading text-[clamp(1.8rem,3vw,2.4rem)] font-normal text-ink mb-8">
            Estimated Delivery by Region
          </h2>
          <div className="border border-sand overflow-hidden">
            {[
              ['Thailand & Southeast Asia', '2–4 business days'],
              ['Japan & East Asia', '3–5 business days'],
              ['Europe', '5–7 business days'],
              ['United States & Canada', '5–7 business days'],
              ['Australia & New Zealand', '5–8 business days'],
              ['Middle East', '5–8 business days'],
              ['Rest of the world', '7–10 business days'],
            ].map(([region, time], i) => (
              <div
                key={region}
                className={`flex justify-between items-center px-6 py-4 border-b border-sand last:border-0 ${i % 2 === 0 ? 'bg-cream' : 'bg-parchment'}`}
              >
                <span className="text-sm text-ink">{region}</span>
                <span className="text-sm font-medium text-moss">{time}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-muted mt-4 leading-relaxed">
            Estimates apply once your order has been dispatched. Times may vary during peak seasons or due to customs processing.
          </p>
        </section>

        {/* Section 5 - Duties & Taxes */}
        <section>
          <SectionLabel text="Important to know" />
          <StarDivider />
          <h2 className="font-heading text-[clamp(1.8rem,3vw,2.4rem)] font-normal text-ink mb-6">
            Duties & Taxes
          </h2>
          <div className="border-l-4 border-moss pl-6 py-1">
            <p className="text-sm text-ink-light leading-relaxed">
              International shipments may be subject to import duties, taxes, or customs fees charged by your country. These charges are not included in your order total and are the responsibility of the recipient. We recommend checking with your local customs authority if you are unsure.
            </p>
          </div>
        </section>

        {/* Section 6 - FAQ */}
        <section>
          <SectionLabel text="Common questions" />
          <StarDivider />
          <h2 className="font-heading text-[clamp(1.8rem,3vw,2.4rem)] font-normal text-ink mb-8">
            FAQs
          </h2>
          <div>
            <FAQItem
              q="How do I track my order?"
              a="Once your order is dispatched, you'll receive a DHL tracking number by email. You can track your parcel anytime at dhl.com/tracking."
            />
            <FAQItem
              q="My books arrived damaged — what should I do?"
              a="Please take photos of the packaging and books, then contact us within 7 days of delivery. We'll sort it out for you."
            />
            <FAQItem
              q="What if no one is home for delivery?"
              a="DHL will typically attempt redelivery or leave a notice with instructions to reschedule or collect from a local DHL service point."
            />
            <FAQItem
              q="Can I change my delivery address after ordering?"
              a="Please contact us as soon as possible. If your order hasn't been dispatched yet, we'll do our best to update it. Once it's with DHL, address changes may not be possible."
            />
            <FAQItem
              q="What if my order is held at customs?"
              a="Customs clearance is handled by your local authority. If there are any issues, DHL will usually contact you directly. You can also reach out to us and we'll help where we can."
            />
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-14 border-t border-sand">
          <h2 className="font-heading text-[clamp(1.8rem,3vw,2.4rem)] font-normal text-ink mb-2">
            Ready to Order?
          </h2>
          <StarDivider />
          <p className="text-ink-light text-sm mb-10 max-w-md mx-auto leading-relaxed">
            Browse our collection of botanical and art books — and ship anywhere in the world.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/shop"
              className="px-8 py-3 bg-moss text-cream font-heading text-sm tracking-wider hover:bg-moss/90 transition-colors"
            >
              Browse Collection
            </Link>
            <Link
              href="/#contact"
              className="px-8 py-3 border border-moss text-moss font-heading text-sm tracking-wider hover:bg-moss hover:text-cream transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </section>

      </div>
    </div>
  )
}
