'use client'

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

export default function TestPage() {
  const [result, setResult] = useState<string>('Testing...')

  useEffect(() => {
    const test = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            auth: {
              persistSession: false
            }
          }
        )

        console.log('Testing connection...')
        console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .limit(1)

        if (error) throw error

        setResult(`Connected! Found ${data.length} tenants.`)
      } catch (error) {
        console.error('Error:', error)
        setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    test()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Supabase Test</h1>
      <div className="p-4 bg-white rounded shadow">
        {result}
      </div>
    </div>
  )
} 