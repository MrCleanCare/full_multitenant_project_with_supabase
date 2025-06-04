'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

interface LoginFormData {
  email: string
  password: string
}

export function LoginForm() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true)
      await signIn(data)
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
          Email
        </label>
        <input
          {...register('email', { required: 'Email is required' })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="m@example.com"
          type="email"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
        />
        {errors.email && (
          <p className="text-sm font-medium text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
          Password
        </label>
        <input
          {...register('password', { required: 'Password is required' })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          type="password"
          autoComplete="current-password"
        />
        {errors.password && (
          <p className="text-sm font-medium text-destructive">{errors.password.message}</p>
        )}
      </div>
      <Button className="w-full" type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  )
} 