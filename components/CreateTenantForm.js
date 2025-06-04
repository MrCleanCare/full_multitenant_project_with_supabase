import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function CreateTenantForm({ onSuccess }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const supabase = createClient()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Generate a slug from the name
      const slug = name.toLowerCase().replace(/\s+/g, '-')

      // Get the current user
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Insert the tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert([{ 
          name, 
          slug,
          owner_id: session.user.id,
          settings: { theme: 'light' },
          subscription_tier: 'basic'
        }])
        .select()
        .single()

      if (tenantError) throw tenantError

      // Add the current user as an admin of the tenant
      const { error: memberError } = await supabase
        .from('tenant_users')
        .insert([{
          tenant_id: tenant.id,
          user_id: session.user.id,
          role: 'admin'
        }])

      if (memberError) throw memberError

      setName('')
      onSuccess && onSuccess(tenant)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Tenant Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter tenant name"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? 'Creating...' : 'Create Tenant'}
      </button>
    </form>
  )
} 