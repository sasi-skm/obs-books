import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | OBS Books',
  description: 'The terms that apply when you order from OBS Books.',
  alternates: { canonical: 'https://www.obsbooks.com/terms' },
}

function SectionLabel({ text }: { text: string }) {
  return (
    <p className="text-xs uppercase tracking-[0.2em] text-moss font-medium mb-3">
      {text}
    </p>
  )
}

function StarDivider() {
  return (
    <p className="text-moss text-xs tracking-[0.3em] my-3 select-none">- ✦ -</p>
  )
}

export default function TermsPage() {
  return (
    <div className="bg-cream min-h-screen">
      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center bg-parchment border-b border-sand">
        <SectionLabel text="OBS Books" />
        <h1 className="font-heading text-[clamp(2.2rem,5vw,3.5rem)] font-normal text-ink mb-4">
          Terms of Service
        </h1>
        <StarDivider />
        <p className="text-ink-light max-w-lg mx-auto leading-relaxed text-sm">
          Plain language, no legal jargon. Here is what to expect when you order from us.
        </p>
      </section>

      {/* Content */}
      <div className="max-w-[720px] mx-auto px-6 py-16 space-y-12">

        <section>
          <h2 className="font-heading text-xl text-ink mb-3">Orders &amp; Payment</h2>
          <p className="text-sm text-ink-light leading-relaxed">
            Prices are listed in Thai baht. You can pay by PromptPay QR, direct bank transfer, or
            by card through Stripe. International card payments are charged in US dollars. Your
            order is confirmed once payment is received or your bank transfer slip is verified.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl text-ink mb-3">Shipping</h2>
          <p className="text-sm text-ink-light leading-relaxed">
            We ship from Bangkok, Thailand. Delivery within Thailand is free. We also ship
            worldwide via DHL Express, with the cost calculated at checkout based on destination
            and weight. See our{' '}
            <Link href="/shipping" className="text-moss underline">
              shipping page
            </Link>{' '}
            for estimated delivery times.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl text-ink mb-3">Returns &amp; Damaged Items</h2>
          <p className="text-sm text-ink-light leading-relaxed">
            If your book arrives damaged, or something is wrong with your order, just contact us
            and we will sort it out. We would rather make it right than have you unhappy with a
            purchase.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl text-ink mb-3">Vintage &amp; Secondhand Books</h2>
          <p className="text-sm text-ink-light leading-relaxed">
            Most of our books are vintage or secondhand. We describe each book&apos;s condition as
            accurately as we can, including any wear, marks, or missing elements, before it is
            listed for sale. Books are sold as described.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl text-ink mb-3">Limitation of Liability</h2>
          <p className="text-sm text-ink-light leading-relaxed">
            We do our best to get every detail right, but to the extent allowed by law, our
            responsibility is limited to putting things right on your order - replacing, refunding,
            or otherwise making it fair.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl text-ink mb-3">Contact</h2>
          <p className="text-sm text-ink-light leading-relaxed">
            OBS Books is operated from Bangkok, Thailand. For any questions about these terms,
            write to us at{' '}
            <a href="mailto:obsbooksstore@gmail.com" className="text-moss underline">
              obsbooksstore@gmail.com
            </a>
            .
          </p>
        </section>

        <section className="pt-8 border-t border-sand text-center">
          <p className="text-sm text-ink-light leading-relaxed">
            Questions? Write to us at{' '}
            <a href="mailto:obsbooksstore@gmail.com" className="text-moss underline">
              obsbooksstore@gmail.com
            </a>
            .
          </p>
          <Link href="/" className="inline-block mt-6 text-xs uppercase tracking-[0.15em] text-moss">
            Back to the homepage
          </Link>
        </section>

      </div>
    </div>
  )
}
