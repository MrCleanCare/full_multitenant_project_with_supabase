'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from './use-supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = useSupabase()

  useEffect(() => {
    let mounted = true

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setUser(session?.user ?? null)

        if (event === 'SIGNED_OUT') {
          router.push('/login')
        } else if (event === 'SIGNED_IN') {
          router.push('/dashboard')
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const handleAuthError = (error: unknown) => {
    if (error instanceof Error) {
      if (error.message === 'Failed to fetch') {
        return 'Unable to connect to the server. Please check your internet connection.'
      }
      return error.message
    }
    return 'An unexpected error occurred'
  }

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    try {
      setError(null)
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw signInError
      }
    } catch (error) {
      const errorMessage = handleAuthError(error)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const signUp = async ({ email, password }: { email: string; password: string }) => {
    try {
      setError(null)

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        throw signUpError
      }

      return { success: true, message: 'Check your email for the confirmation link' }
    } catch (error) {
      const errorMessage = handleAuthError(error)
      setError(errorMessage)
      return { success: false, message: errorMessage }
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const { error: signOutError } = await supabase.auth.signOut()
      
      if (signOutError) {
        throw signOutError
      }
    } catch (error) {
      const errorMessage = handleAuthError(error)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  }
} 