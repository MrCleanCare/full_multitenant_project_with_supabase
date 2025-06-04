'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

if (process.env.NODE_ENV === 'development') {
  console.log('Supabase URL:', supabaseUrl)
  console.log('Site URL:', process.env.NEXT_PUBLIC_SITE_URL)
}

export function useSupabase() {
  const [client] = useState(() =>
    createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'X-Client-Info': 'supabase-js-browser/2.38.4',
        },
      },
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return ''
          const cookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
          return cookie ? cookie.split('=')[1] : ''
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number }) {
          if (typeof document === 'undefined') return
          let cookie = `${name}=${value}`
          if (options.maxAge) {
            cookie += `; Max-Age=${options.maxAge}`
          }
          if (options.path) {
            cookie += `; Path=${options.path}`
          }
          cookie += '; SameSite=Lax; Secure'
          document.cookie = cookie
        },
        remove(name: string, options: { path?: string }) {
          if (typeof document === 'undefined') return
          document.cookie = `${name}=; Max-Age=0${options.path ? `; Path=${options.path}` : ''}; SameSite=Lax; Secure`
        },
      },
    })
  )

  useEffect(() => {
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // Refresh the current page to ensure we're in sync with the server
        window.location.reload()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [client.auth])

  return client
} 