# OBS Books - Handoff Document for Continuation

## What This Project Is
E-commerce website for **OBS Books** - a used bookstore in Bangkok selling vintage illustrated books about flowers, nature, cookbooks, and fairy tales. Owned by Sasi.

- **Live site**: https://obs-books.vercel.app
- **Admin panel**: /admin (login with Supabase credentials)
- **Tech**: Next.js 14 + TypeScript + Tailwind CSS + Supabase + Vercel

---

## How to Run Locally

```bash
npm install
npm run dev
```
Open http://localhost:3000

## How to Deploy to Vercel
```bash
npx vercel --yes --prod --scope julians-projects-0e1b3890
```

---

## Credentials & Services

### Supabase (Database + Storage)
- Project URL: https://xquzachvmptvrmovvlgc.supabase.co
- Keys are in `.env.local` (never commit this file)
- Tables: `books`, `orders`, `order_items`
- Storage buckets: `book-images` (public), `payment-slips` (private)
- Admin login email: sasiwimolskm@gmail.com (password set in Supabase Auth)

### Tawk.to (Live Chat)
- Property ID: `69cccad97a1fd31c39851dcb`
- Configured in `components/layout/TawktoChat.tsx`
- Manage chats at https://tawk.to

### PromptPay
- Phone number: 0837845392 (Sasi's number linked to PromptPay)

---

## What Was Built & Changed (Session Summary)

### Design Changes
- **Hero background**: Book mosaic opacity increased to 35% so images are visible
- **Hero logo**: Fairy tale particles added - animated stars (✦ ✧ ⋆) and flowers (✿ ❀ ✾) floating around the logo
- **Contact section**: Real brand SVG icons for Instagram, Facebook, TikTok (replaced emojis)

### New Features Added
1. **Live chat (Tawk.to)** - Chat bubble in bottom-right corner of all pages
2. **Multi-photo upload** - Admin can upload up to 9 photos per book (first = cover)
3. **Video upload** - Admin can upload 1 video per book (shown in gallery)
4. **4 condition levels** - Like New / Very Good / Good / Well Read (replaced old 3-level system)
5. **Per-condition pricing** - Each condition has its own price; customers choose on book page
6. **Book gallery** - Book detail page shows photo thumbnails + video player
7. **Condition selector** - Customers pick condition, price updates live

### Database Migration Run
These columns were added to the `books` table:
```sql
ALTER TABLE books ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
ALTER TABLE books ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS condition_prices JSONB DEFAULT '{}';
```

### Supabase RLS Policies Added
```sql
-- Admin (authenticated users) can do everything
CREATE POLICY "Admin can do everything with books" ON books FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Public can view books (customer site)
CREATE POLICY "Public can view books" ON books FOR SELECT TO anon USING (true);
```

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `lib/translations.ts` | ALL website text in EN + TH - edit here to change any text |
| `components/storefront/HeroSection.tsx` | Homepage hero with logo particles |
| `components/storefront/ContactSection.tsx` | Contact/social links section |
| `components/storefront/BookCard.tsx` | Book card shown in shop grid |
| `app/book/[id]/BookDetailClient.tsx` | Book detail page (gallery, condition selector) |
| `app/admin/books/new/page.tsx` | Admin - add new book form |
| `app/admin/books/[id]/page.tsx` | Admin - edit book form |
| `components/layout/TawktoChat.tsx` | Tawk.to live chat widget |
| `types/index.ts` | TypeScript types for Book, Order, CartItem etc |
| `app/globals.css` | Global CSS + animations |
| `tailwind.config.ts` | Design tokens (colors, fonts, shadows) |

---

## Design System

```
Colors:
  cream:    #FAF6F0  (background)
  sage:     #6B7F5E  (green - primary)
  rose:     #B4636E  (pink/red - accents)
  bark:     #7A6048  (brown - prices)
  ink:      #2C2418  (text)

Fonts:
  Headings: Cormorant Garamond
  Body:     Crimson Text
  Thai:     Noto Sans Thai

Aesthetic: cottagecore, vintage botanical, fairy tale, warm golden-hour
```

---

## Things That May Still Need Work

- **Deploy to Vercel** - Run the deploy command above to push latest changes live
- **Tawk.to setup** - May need to finish configuring the chat widget at tawk.to dashboard
- **Mobile testing** - Test the photo gallery and condition selector on mobile
- **Cart display** - Cart drawer shows condition with each item (check it looks good)
- **Order notifications** - Currently no email sent to Sasi when orders come in
- **Thai translations** - Any new UI text added should get a Thai translation in `lib/translations.ts`

---

## Important Rules (from Sasi)
- Language: English/Thai toggle (one at a time, English default)
- Payments: PromptPay + bank transfer ONLY (no credit cards)
- Admin dashboard is English only
- Never use em dashes - use hyphens instead
- All customer-facing text must be bilingual (add to `lib/translations.ts`)
