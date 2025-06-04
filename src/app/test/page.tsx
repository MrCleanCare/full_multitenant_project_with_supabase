'use client'

import { useEffect, useState } from 'react'
import { testSupabaseConnection } from '@/utils/test-supabase'

export default function TestPage() {
  const [results, setResults] = useState<Array<{
    operation: string
    status: 'success' | 'error'
    message: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const runTests = async () => {
      try {
        const testResults = await testSupabaseConnection()
        setResults(testResults)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    runTests()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Testing Supabase Connection...</h1>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Test Failed</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase Connection Test Results</h1>
        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`bg-white p-6 rounded-lg shadow-sm border-l-4 ${
                result.status === 'success' ? 'border-green-500' : 'border-red-500'
              }`}
            >
              <h3 className="font-semibold text-lg mb-2">{result.operation}</h3>
              <p
                className={
                  result.status === 'success' ? 'text-green-700' : 'text-red-700'
                }
              >
                {result.message}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 