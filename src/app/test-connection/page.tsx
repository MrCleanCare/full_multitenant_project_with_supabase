'use client'

import { useEffect, useState } from 'react'

type TestResult = {
  success: boolean
  database?: string
  realtime?: string
  auth?: string
  error?: string
  timestamp: string
}

export default function TestConnectionPage() {
  const [result, setResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function runTest() {
      try {
        const response = await fetch('/api/test-connection')
        const data = await response.json()
        setResult(data)
      } catch (error) {
        setResult({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to run test',
          timestamp: new Date().toISOString()
        })
      } finally {
        setLoading(false)
      }
    }

    runTest()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Testing Connection...</h1>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Connection Test Results</h1>
        
        <div className={`p-6 rounded-lg shadow-sm ${
          result?.success ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <span className={result?.success ? 'text-green-600' : 'text-red-600'}>
                {result?.success ? 'Connected' : 'Failed'}
              </span>
            </div>

            {result?.database && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Database:</span>
                <span className="text-green-600">{result.database}</span>
              </div>
            )}

            {result?.realtime && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Realtime:</span>
                <span className="text-green-600">{result.realtime}</span>
              </div>
            )}

            {result?.auth && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Auth:</span>
                <span className="text-green-600">{result.auth}</span>
              </div>
            )}

            {result?.error && (
              <div className="mt-4 p-4 bg-red-100 rounded">
                <p className="text-red-700">{result.error}</p>
              </div>
            )}

            <div className="text-sm text-gray-500 mt-4">
              Last checked: {new Date(result?.timestamp || '').toLocaleString()}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setLoading(true)
            window.location.reload()
          }}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Test Again
        </button>
      </div>
    </div>
  )
} 