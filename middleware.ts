import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Admin-only emails (must match lib/admin-auth.ts ADMIN_EMAILS)
const ADMIN_EMAILS = [
  'sasiwimolskm@gmail.com',
  'sasiwimolkaewkamol@gmail.com',
]

// Gate every /admin/* request server-side before it reaches any page or
// layout component. The admin layout.tsx does a client-side check too,
// but that only fires after the JS bundle is delivered to the browser --
// a determined attacker could bypass it. This middleware runs on the
// edge before any response is sent.
//
// /admin/login is excluded from the matcher so the login page is always
// reachable.
export async function middleware(req: NextRequest) {
  // If Supabase is not configured (local dev without .env.local) skip
  // the auth gate so the dev experience is not broken.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl === 'https://placeholder.supabase.co'
  ) {
    return NextResponse.next()
  }

  const res = NextResponse.next()

  // createServerClient from @supabase/ssr reads cookies from the request
  // and writes any refreshed tokens back to the response. This is the
  // recommended pattern for App Router middleware (docs.supabase.com/guides/auth/server-side/nextjs).
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options)
        })
      },
    },
  })

  // getUser() validates the JWT server-side (not just from the cookie
  // payload). Returns null if the session is missing or expired.
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/admin/login'
    // Preserve the originally-requested URL so the login page could
    // redirect back after a successful sign-in (future enhancement).
    loginUrl.searchParams.set('next', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return res
}

export const config = {
  // Match /admin and all /admin/* paths, EXCEPT /admin/login itself.
  // The negative lookahead (?!login) excludes the login page so it
  // remains publicly reachable (the middleware would otherwise redirect
  // to login, which redirects to login again in a loop).
  matcher: ['/admin', '/admin/((?!login).+)'],
}
