import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookieOptions: {
        path: '/',
        sameSite: 'lax',
        secure: typeof window !== 'undefined' ? window.location.protocol === 'https:' : process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      },
    }
  )
}

