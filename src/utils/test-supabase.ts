'use client'

import { createClient } from '@/lib/supabase/client'

export async function testSupabaseConnection() {
  const supabase = createClient()
  const results: { operation: string; status: 'success' | 'error'; message: string }[] = []

  // Test 1: Basic Connection
  try {
    const { data, error } = await supabase.from('tenants').select('count').single()
    results.push({
      operation: 'Database Connection',
      status: error ? 'error' : 'success',
      message: error ? error.message : 'Successfully connected to Supabase'
    })
  } catch (error) {
    results.push({
      operation: 'Database Connection',
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to connect to database'
    })
  }

  // Test 2: Authentication
  try {
    const { data, error } = await supabase.auth.getSession()
    results.push({
      operation: 'Authentication Service',
      status: error ? 'error' : 'success',
      message: error ? error.message : 'Auth service is working'
    })
  } catch (error) {
    results.push({
      operation: 'Authentication Service',
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to test auth service'
    })
  }

  // Test 3: Database Queries
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .limit(1)
    
    results.push({
      operation: 'Database Query',
      status: error ? 'error' : 'success',
      message: error ? error.message : `Successfully executed database query${data?.length ? ` (${data.length} results)` : ''}`
    })
  } catch (error) {
    results.push({
      operation: 'Database Query',
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to execute database query'
    })
  }

  // Test 4: RLS Policies
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      results.push({
        operation: 'RLS Policies',
        status: 'error',
        message: 'No authenticated session to test RLS policies'
      })
    } else {
      const { data, error } = await supabase
        .from('user_tenants')
        .select('*')
        .limit(1)
      
      results.push({
        operation: 'RLS Policies',
        status: error ? 'error' : 'success',
        message: error ? error.message : `RLS policies are working${data?.length ? ` (${data.length} results)` : ''}`
      })
    }
  } catch (error) {
    results.push({
      operation: 'RLS Policies',
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to test RLS policies'
    })
  }

  // Test 5: Real-time Subscription
  try {
    const channel = supabase.channel('test')
    const subscription = channel.subscribe((status) => {
      results.push({
        operation: 'Real-time Service',
        status: status === 'SUBSCRIBED' ? 'success' : 'error',
        message: `Real-time service is ${status === 'SUBSCRIBED' ? 'working' : 'not working'}`
      })
    })

    // Clean up subscription after 2 seconds
    setTimeout(() => {
      subscription.unsubscribe()
    }, 2000)
  } catch (error) {
    results.push({
      operation: 'Real-time Service',
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to test real-time service'
    })
  }

  return results
} 