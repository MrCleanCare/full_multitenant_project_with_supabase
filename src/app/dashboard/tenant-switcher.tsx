'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PostgrestError } from '@supabase/supabase-js'

interface Tenant {
  id: string
  name: string
  slug: string
}

export default function TenantSwitcher() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadTenants() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        // First get the tenant IDs for the user
        const { data: tenantUsers, error: tenantUsersError } = await supabase
          .from('tenant_users')
          .select('tenant_id')
          .eq('user_id', session.user.id)

        if (tenantUsersError) throw tenantUsersError

        if (!tenantUsers.length) {
          setTenants([])
          return
        }

        // Then get the tenant details
        const { data: tenantsData, error: tenantsError } = await supabase
          .from('tenants')
          .select('id, name, slug')
          .in('id', tenantUsers.map(tu => tu.tenant_id))

        if (tenantsError) throw tenantsError

        setTenants(tenantsData)

        if (tenantsData.length > 0 && !selectedTenant) {
          setSelectedTenant(tenantsData[0])
        }
      } catch (error) {
        setError(error instanceof PostgrestError ? error.message : 'An error occurred')
      }
    }

    loadTenants()
  }, [supabase, selectedTenant])

  const handleTenantChange = async (tenantId: string) => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .eq('id', tenantId)
        .single()

      if (error) throw error

      setSelectedTenant(data)
    } catch (error) {
      setError(error instanceof PostgrestError ? error.message : 'An error occurred')
    }
  }

  return (
    <div className="flex items-center gap-4">
      <select
        value={selectedTenant?.id || ''}
        onChange={(e) => handleTenantChange(e.target.value)}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        <option value="">Select a tenant</option>
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
} 