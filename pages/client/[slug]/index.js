import { useRouter } from 'next/router'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'

export default function ClientDashboard() {
  const router = useRouter()
  const { slug } = router.query
  const session = useSession()
  const supabase = useSupabaseClient()
  const [tenant, setTenant] = useState(null)
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!session) {
      router.push('/')
      return
    }

    async function loadTenantData() {
      if (!slug) return

      try {
        // Fetch tenant details
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('slug', slug)
          .single()

        if (tenantError) throw tenantError
        setTenant(tenantData)

        // Fetch templates for this tenant
        const { data: templatesData, error: templatesError } = await supabase
          .from('templates')
          .select('*')
          .eq('tenant_id', tenantData.id)

        if (templatesError) throw templatesError
        setTemplates(templatesData || [])
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    loadTenantData()
  }, [session, slug, supabase, router])

  if (!session) {
    return null // Will redirect in useEffect
  }

  if (loading) {
    return <div className="container">Loading...</div>
  }

  if (error) {
    return (
      <div className="container">
        <p>Error: {error}</p>
        <button onClick={() => router.push('/')}>Back to Home</button>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="container">
        <p>Tenant not found</p>
        <button onClick={() => router.push('/')}>Back to Home</button>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: '50px 0 100px 0' }}>
      <h1>{tenant.name} Dashboard</h1>
      <div style={{ margin: '20px 0' }}>
        <h2>Tenant Details:</h2>
        <p>Status: {tenant.status}</p>
        <p>Subscription: {tenant.subscription_tier}</p>
      </div>

      <div style={{ margin: '20px 0' }}>
        <h2>Templates:</h2>
        {templates.length === 0 ? (
          <p>No templates found.</p>
        ) : (
          templates.map((template) => (
            <div key={template.id} style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc' }}>
              <h3>{template.name}</h3>
              <p>{template.description}</p>
              <p>Status: {template.status}</p>
            </div>
          ))
        )}
      </div>

      <button onClick={() => router.push('/')}>Back to Home</button>
    </div>
  )
} 