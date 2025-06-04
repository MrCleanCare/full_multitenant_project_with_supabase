import { useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export default function CreateTenantForm({ onSuccess }) {
  const supabase = useSupabaseClient()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Generate a slug from the name
      const slug = name.toLowerCase().replace(/\s+/g, '-')

      // Insert the tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert([{ name, slug }])
        .select()
        .single()

      if (tenantError) throw tenantError

      // Add the current user as an admin of the tenant
      const { error: memberError } = await supabase
        .from('tenant_users')
        .insert([{
          tenant_id: tenant.id,
          user_id: (await supabase.auth.getUser()).data.user.id,
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
    <div style={{ 
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2>Create New Tenant</h2>
      {error && (
        <div className="error" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label
            htmlFor="tenantName"
            style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: '500'
            }}
          >
            Tenant Name
          </label>
          <input
            id="tenantName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter tenant name"
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: loading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Creating...' : 'Create Tenant'}
        </button>
      </form>
    </div>
  )
} 