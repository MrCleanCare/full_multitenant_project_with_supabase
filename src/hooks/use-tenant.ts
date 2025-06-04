'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from './use-supabase'
import type { Database } from '@/types/supabase'

type Tenant = Database['public']['Tables']['tenants']['Row']

export function useTenant() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useSupabase()

  useEffect(() => {
    async function loadTenants() {
      try {
        setError(null)
        const { data: tenantIds, error: tenantIdsError } = await supabase
          .from('user_tenants')
          .select('tenant_id')

        if (tenantIdsError) throw tenantIdsError

        if (!tenantIds?.length) {
          setTenants([])
          setCurrentTenant(null)
          return
        }

        const { data: tenants, error: tenantsError } = await supabase
          .from('tenants')
          .select('*')
          .in('id', tenantIds.map(t => t.tenant_id))

        if (tenantsError) throw tenantsError

        if (tenants) {
          setTenants(tenants)
          if (!currentTenant && tenants.length > 0) {
            setCurrentTenant(tenants[0])
          }
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Error loading tenants')
        console.error('Error loading tenants:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTenants()
  }, [supabase, currentTenant])

  const switchTenant = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId)
    if (tenant) {
      setCurrentTenant(tenant)
    }
  }

  return {
    tenants,
    currentTenant,
    loading,
    error,
    switchTenant
  }
} 