import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Welcome to Multi-tenant SaaS</h1>
        <p className="text-lg mb-4">
          A powerful multi-tenant application built with Next.js and Supabase
        </p>
      </div>
    </main>
  )
} 