import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET() {
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

  // Test 2: Database Queries
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

  return NextResponse.json({ results })
} 