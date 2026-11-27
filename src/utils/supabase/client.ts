import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const THIRTY_DAYS = 60 * 60 * 24 * 30
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: THIRTY_DAYS,
        path: '/',
        sameSite: 'lax',
      },
    }
  )
}
