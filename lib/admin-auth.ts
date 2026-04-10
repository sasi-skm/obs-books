import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

const ADMIN_EMAILS = [
  'sasiwimolskm@gmail.com',
  'sasiwimolkaewkamol@gmail.com',
]

export async function requireAdmin(req: NextRequest) {
  try {
    // Extract token from Authorization header or cookie
    let token: string | null = null

    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7)
    }

    if (!token) {
      // Try Supabase auth cookie
      const cookieHeader = req.headers.get('cookie') || ''
      const cookies = cookieHeader.split(';').map(c => c.trim())
      for (const cookie of cookies) {
        if (cookie.startsWith('sb-') && cookie.includes('-auth-token=')) {
          const value = cookie.split('=').slice(1).join('=')
          // The cookie value may be a JSON array with the access token as first element
          try {
            const parsed = JSON.parse(decodeURIComponent(value))
            if (Array.isArray(parsed) && parsed[0]) {
              token = parsed[0]
            } else if (typeof parsed === 'string') {
              token = parsed
            }
          } catch {
            token = decodeURIComponent(value)
          }
          break
        }
      }
    }

    if (!token) return null

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user || !user.email) return null

    if (!ADMIN_EMAILS.includes(user.email)) return null

    return user
  } catch {
    return null
  }
}
