import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = useSupabaseClient()

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        router.push('/dashboard')
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [router, supabase])

  return (
    <div className="container loading">
      <p>Loading...</p>
    </div>
  )
} 