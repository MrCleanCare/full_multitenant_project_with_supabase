import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { getRedirectURL } from '../utils/config'

export default function Home() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  if (session) {
    return <div className="container loading">Redirecting to dashboard...</div>
  }

  return (
    <div className="container" style={{ 
      padding: '50px 0 100px 0',
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Welcome</h1>
      <div style={{ 
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#0070f3',
                  brandAccent: '#0051a2',
                }
              }
            }
          }}
          theme="light"
          providers={['github', 'google']}
          redirectTo={getRedirectURL()}
        />
      </div>
    </div>
  )
} 