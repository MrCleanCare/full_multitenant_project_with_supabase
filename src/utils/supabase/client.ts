import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const createClient = () => {
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'supabase.auth.token',
      },
      cookies: {
        get(name: string) {
          const cookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
          return cookie ? cookie.split('=')[1] : undefined
        },
        set(name: string, value: string, options: { lifetime?: number; domain?: string; path?: string; sameSite?: string }) {
          document.cookie = `${name}=${value}; Max-Age=${options.lifetime || 60 * 60 * 24 * 7}; Domain=${options.domain || ''}; Path=${options.path || '/'}; SameSite=${options.sameSite || 'lax'}`
        },
        remove(name: string, options: { domain?: string; path?: string }) {
          document.cookie = `${name}=; Max-Age=0; Domain=${options.domain || ''}; Path=${options.path || '/'}`
        }
      }
    }
  )
}

export default createClient 