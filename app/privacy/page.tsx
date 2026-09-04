import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | OBS Books',
  description: 'How OBS Books collects, uses, and protects your information.',
  alternates: { canonical: 'https://www.obsbooks.com/privacy' },
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

export default function PrivacyPage() {
  return (
    <div className="bg-cream min-h-screen">
      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center bg-parchment border-b border-sand">
        <SectionLabel text="OBS Books" />
        <h1 className="font-heading text-[clamp(2.2rem,5vw,3.5rem)] font-normal text-ink mb-4">
          Privacy Policy
        </h1>
        <StarDivider />
        <p className="text-ink-light max-w-lg mx-auto leading-relaxed text-sm">
          We are a small bookshop, not a data company. Here is exactly what we collect and why.
        </p>
      </section>

      {/* Content */}
      <div className="max-w-[720px] mx-auto px-6 py-16 space-y-12">

        <section>
          <h2 className="font-heading text-xl text-ink mb-3">What We Collect</h2>
          <p className="text-sm text-ink-light leading-relaxed">
            When you place an order or create an account, we collect your name, email address,
            delivery address, and phone number. We use these only to prepare, pack, and ship your
            order and to reach you if there is a question about it.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl text-ink mb-3">Payments</h2>
          <p className="text-sm text-ink-light leading-relaxed">
            We accept PromptPay QR, direct bank transfer, and card payments processed by Stripe.
            For PromptPay and bank transfer, we do not handle or store any card details at all.
            For card payments, Stripe processes and stores your card information directly. We
            never see or store your full card number.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl text-ink mb-3">Why We Collect It</h2>
          <p className="text-sm text-ink-light leading-relaxed">
            Your information is used to fulfil your order, send order and shipping updates, and
            respond if you contact us. That is the whole list.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl text-ink mb-3">What We Do Not Do</h2>
          <p className="text-sm text-ink-light leading-relaxed">
            We do not sell or rent your information to anyone. We do not run advertising trackers
            or pixels on this site, and we do not use your data for targeted advertising.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl text-ink mb-3">Cookies</h2>
          <p className="text-sm text-ink-light leading-relaxed">
            This site does not use advertising or tracking cookies. Your shopping cart is stored
            in your browser, not in a cookie. Our live chat widget (Tawk.to) and our payment
            processor (Stripe) may set their own cookies when you use those features, so they can
            work properly.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl text-ink mb-3">How Long We Keep It</h2>
          <p className="text-sm text-ink-light leading-relaxed">
            We keep order and account information for as long as needed to fulfil orders, handle
            any follow-up questions, and meet our bookkeeping obligations.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl text-ink mb-3">Questions or Deletion Requests</h2>
          <p className="text-sm text-ink-light leading-relaxed">
            OBS Books is operated from Bangkok, Thailand. If you have questions about your data,
            or would like us to delete it, write to us at{' '}
            <a href="mailto:obsbooksstore@gmail.com" className="text-moss underline">
              obsbooksstore@gmail.com
            </a>{' '}
            and we will help.
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
