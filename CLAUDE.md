# OBS Books - Project Instructions

## What This Is
E-commerce website for OBS Books, a used bookstore in Bangkok selling vintage illustrated books about flowers, nature, cookbooks, and fairy tales.

## Tech Stack
- **Framework**: Next.js 14 (App Router) with TypeScript
- **Database**: Supabase (PostgreSQL) - hosted at https://xquzachvmptvrmovvlgc.supabase.co
- **Styling**: Tailwind CSS with custom design tokens (cottagecore/botanical aesthetic)
- **Payments**: PromptPay QR code generation (zero fees) + bank transfer
- **Hosting**: Vercel at https://obs-books.vercel.app

## Design System
- Colors: cream (#FAF6F0), sage green (#6B7F5E), rose (#B4636E), bark (#7A6048)
- Fonts: Cormorant Garamond (headings), Crimson Text (body), Noto Sans Thai (Thai text)
- Aesthetic: cottagecore, vintage botanical, warm golden-hour feel
- Logo: hand-drawn botanical wreath with "OBS BOOKs - The Book Itself Is a Treasure"

## Key Directories
- `app/` - Next.js pages and API routes
- `components/` - React components (storefront, cart, checkout, admin)
- `lib/` - Supabase clients, translations, PromptPay QR, tracking
- `public/images/` - Book photos and logo
- `supabase/` - Database seed SQL

## Important Rules
- Language: EN/TH toggle (one language at a time, English default)
- Payments: PromptPay + bank transfer ONLY (no credit cards, no Shopee)
- Admin dashboard at /admin is English only
- All customer-facing text must be bilingual (add to lib/translations.ts)
- Never use em dashes - use hyphens instead

## How to Run Locally
```bash
npm install
npm run dev
```

## How to Deploy
```bash
npx vercel --yes --prod --scope julians-projects-0e1b3890
```

## Database
Supabase tables: books, orders, order_items
Storage buckets: book-images, payment-slips
The owner (Sasi) manages books and orders through the /admin dashboard.
