import Link from 'next/link'

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

export default function NotFound() {
  return (
    <div className="bg-cream min-h-screen">
      <section className="pt-32 pb-24 px-6 text-center bg-parchment border-b border-sand min-h-[70vh] flex flex-col items-center justify-center">
        <SectionLabel text="404" />
        <h1 className="font-heading text-[clamp(2.2rem,5vw,3.5rem)] font-normal text-ink mb-4 max-w-xl">
          This page seems to be missing from our shelves
        </h1>
        <StarDivider />
        <p className="text-ink-light max-w-md mx-auto leading-relaxed text-sm mb-10">
          It may have been moved, sold, or perhaps it never sat on this shelf at all. Let&apos;s get you back among the books.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/"
            className="px-8 py-3 bg-moss text-cream font-heading text-sm tracking-wider hover:bg-moss/90 transition-colors"
          >
            Back to the Homepage
          </Link>
          <Link
            href="/shop"
            className="px-8 py-3 border border-moss text-moss font-heading text-sm tracking-wider hover:bg-moss hover:text-cream transition-colors"
          >
            Browse the Collection
          </Link>
        </div>
      </section>
    </div>
  )
}
