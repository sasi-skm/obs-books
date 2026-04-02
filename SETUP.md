# OBS Books - Setup Guide

## Quick Start (Development)

The site works out of the box with sample data - no Supabase needed for development.

```bash
cd obs-books
npm install
npm run dev
```

Visit http://localhost:3000 to see the site. The sample 32 books will display. Cart, checkout, and language toggle all work locally.

Admin panel: http://localhost:3000/admin/login (enter any email/password in dev mode)

---

## Production Setup (~15 minutes)

### Step 1: Create Supabase Project

1. Go to https://supabase.com and sign up (free)
2. Click "New Project"
3. Choose a name (e.g. "obs-books"), set a database password, pick the closest region (Singapore for Thailand)
4. Wait ~2 minutes for the project to be created

### Step 2: Run the Database Setup

1. In your Supabase dashboard, click "SQL Editor" in the left sidebar
2. Click "New Query"
3. Copy the entire contents of `supabase/seed.sql` and paste it
4. Click "Run" - this creates all tables, storage buckets, security policies, and seeds 32 books

### Step 3: Create Admin User for Sasi

1. In Supabase dashboard, go to "Authentication" > "Users"
2. Click "Add User" > "Create new user"
3. Enter Sasi's email and a password she'll remember
4. This is her admin login for managing books and orders

### Step 4: Get Your API Keys

1. In Supabase dashboard, go to "Settings" > "API"
2. Copy these three values:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (another long string - keep this SECRET)

### Step 5: Deploy to Vercel

1. Push this code to a GitHub repository
2. Go to https://vercel.com and sign up (free)
3. Click "Import Project" and select your GitHub repo
4. In "Environment Variables", add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service_role key |
| `NEXT_PUBLIC_PROMPTPAY_ID` | Sasi's PromptPay phone number (10 digits) |

5. Click "Deploy" - Vercel will build and deploy automatically

### Step 6: Update .env.local for Local Development

Copy the same values into your `.env.local` file so local dev connects to the real database.

### Step 7: (Optional) Custom Domain

1. In Vercel dashboard, go to your project > "Settings" > "Domains"
2. Add your domain (e.g. obsbooks.com)
3. Follow the DNS instructions Vercel gives you

---

## Sasi's Daily Workflow

### Adding a new book
1. Go to yoursite.com/admin
2. Login with your email and password
3. Click "Books" > "Add Book"
4. Fill in the details, take a photo
5. Click "Save Book"

### Confirming a payment
1. Go to "Orders"
2. Find the new order
3. Click "View Slip" to see the payment screenshot
4. Click "Confirm" if the payment is correct

### Shipping an order
1. Find the confirmed order
2. Click "Ship"
3. Enter the tracking number and courier name
4. The customer can now track their order on the website

---

## Cost

| Service | Monthly Cost |
|---------|-------------|
| Vercel Hosting | $0 (free tier) |
| Supabase Database + Storage | $0 (free tier) |
| PromptPay Payments | $0 (no fees) |
| Domain (optional) | ~$1/month |
| **Total** | **$0 - $1/month** |
