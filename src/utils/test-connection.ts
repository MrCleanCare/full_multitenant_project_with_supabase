import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export async function testConnection() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // Test database connection
    const { data: dbTest, error: dbError } = await supabase
      .from('tenants')
      .select('count')
      .single()
    
    if (dbError) throw dbError

    // Test realtime
    const channel = supabase.channel('connection-test')
    const realtimePromise = new Promise((resolve, reject) => {
      channel
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            resolve(true)
          }
          if (status === 'CHANNEL_ERROR') {
            reject(new Error('Realtime connection failed'))
          }
        })
    })

    await Promise.race([
      realtimePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Realtime connection timeout')), 5000))
    ])

    // Test auth
    const { data: authTest, error: authError } = await supabase.auth.getSession()
    if (authError) throw authError

    return {
      success: true,
      database: 'connected',
      realtime: 'connected',
      auth: 'connected',
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
} 