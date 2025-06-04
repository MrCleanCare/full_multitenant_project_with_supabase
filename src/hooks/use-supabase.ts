'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export function useSupabase() {
  const [client] = useState(() =>
    createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
      },
      cookies: {
        get(name: string) {
          const cookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
          return cookie ? cookie.split('=')[1] : ''
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number }) {
          let cookie = `${name}=${value}`
          if (options.maxAge) {
            cookie += `; Max-Age=${options.maxAge}`
          }
          if (options.path) {
            cookie += `; Path=${options.path}`
          }
          document.cookie = cookie
        },
        remove(name: string, options: { path?: string }) {
          document.cookie = `${name}=; Max-Age=0${options.path ? `; Path=${options.path}` : ''}`
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