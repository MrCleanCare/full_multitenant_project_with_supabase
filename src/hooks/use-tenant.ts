import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tenant, TenantUser } from '@/types'
import { useAuth } from './use-auth'

export function useTenant() {
  const { user } = useAuth()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserTenants()
    }
  }, [user])

  const fetchUserTenants = async () => {
    try {
      const { data: tenantUsers, error: tenantUsersError } = await supabase
        .from('tenant_users')
        .select('tenant_id, role')
        .eq('user_id', user?.id)

      if (tenantUsersError) throw tenantUsersError

      if (tenantUsers?.length) {
        const { data: tenantsData, error: tenantsError } = await supabase
          .from('tenants')
          .select('*')
          .in(
            'id',
            tenantUsers.map((tu) => tu.tenant_id)
          )

        if (tenantsError) throw tenantsError

        setTenants(tenantsData)
        if (!currentTenant && tenantsData.length > 0) {
          setCurrentTenant(tenantsData[0])
        }
      }
    } catch (error) {
      console.error('Error fetching tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTenant = async (data: Partial<Tenant>) => {
    try {
      const { data: tenant, error } = await supabase
        .from('tenants')
        .insert([{ ...data, owner_id: user?.id }])
        .select()
        .single()

      if (error) throw error

      // Add creator as tenant owner
      const { error: userError } = await supabase.from('tenant_users').insert([
        {
          tenant_id: tenant.id,
          user_id: user?.id,
          role: 'owner',
        },
      ])

      if (userError) throw userError

      setTenants([...tenants, tenant])
      return tenant
    } catch (error) {
      console.error('Error creating tenant:', error)
      throw error
    }
  }

  const updateTenant = async (id: string, data: Partial<Tenant>) => {
    try {
      const { data: tenant, error } = await supabase
        .from('tenants')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setTenants(tenants.map((t) => (t.id === id ? tenant : t)))
      if (currentTenant?.id === id) {
        setCurrentTenant(tenant)
      }

      return tenant
    } catch (error) {
      console.error('Error updating tenant:', error)
      throw error
    }
  }

  const addTenantUser = async (tenantId: string, userId: string, role: TenantUser['role']) => {
    try {
      const { error } = await supabase.from('tenant_users').insert([
        {
          tenant_id: tenantId,
          user_id: userId,
          role,
        },
      ])

      if (error) throw error
    } catch (error) {
      console.error('Error adding tenant user:', error)
      throw error
    }
  }

  const switchTenant = (tenant: Tenant) => {
    setCurrentTenant(tenant)
  }

  return {
    tenants,
    currentTenant,
    loading,
    createTenant,
    updateTenant,
    addTenantUser,
    switchTenant,
    refreshTenants: fetchUserTenants,
  }
} 