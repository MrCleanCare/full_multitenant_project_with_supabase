import { createTestClient, setupTestUser } from './utils/supabase-test-utils'
import type { Database } from '@/types/supabase'
import { SupabaseClient } from '@supabase/supabase-js'

describe('Database Query Tests', () => {
  let supabase: SupabaseClient<Database>
  let testTenant: Database['public']['Tables']['tenants']['Row']

  beforeAll(async () => {
    supabase = createTestClient()
    const testUser = await setupTestUser(supabase)
    
    // Create a test tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .insert({
        name: 'Test Tenant',
        slug: `test-${Date.now()}`,
        created_by: testUser.email,
      })
      .single()

    testTenant = tenant!
  })

  describe('Basic Queries', () => {
    it('should fetch all tenants', async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
    })

    it('should fetch a single tenant by ID', async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', testTenant.id)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.id).toBe(testTenant.id)
    })

    it('should fetch tenants with pagination', async () => {
      const pageSize = 2
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .range(0, pageSize - 1)

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeLessThanOrEqual(pageSize)
    })
  })

  describe('Advanced Queries', () => {
    it('should fetch tenants with filters', async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('created_by', testTenant.created_by)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should fetch tenants with ordering', async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false })

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
      if (data && data.length > 1) {
        expect(new Date(data[0].created_at).getTime())
          .toBeGreaterThanOrEqual(new Date(data[1].created_at).getTime())
      }
    })

    it('should fetch tenants with search', async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .textSearch('name', 'Test')

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
      data?.forEach(tenant => {
        expect(tenant.name.toLowerCase()).toContain('test')
      })
    })
  })

  describe('Joins and Relations', () => {
    it('should fetch tenant with user associations', async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          user_tenants (
            user_id,
            role
          )
        `)
        .eq('id', testTenant.id)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(Array.isArray(data?.user_tenants)).toBe(true)
    })

    it('should fetch users in a tenant', async () => {
      const { data, error } = await supabase
        .from('user_tenants')
        .select('user_id, role')
        .eq('tenant_id', testTenant.id)

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('Count and Aggregations', () => {
    it('should count total tenants', async () => {
      const { count, error } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })

      expect(error).toBeNull()
      expect(typeof count).toBe('number')
      expect(count).toBeGreaterThan(0)
    })

    it('should count users per tenant', async () => {
      const { data, error } = await supabase
        .from('user_tenants')
        .select('tenant_id, count', { count: 'exact' })
        .eq('tenant_id', testTenant.id)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle non-existent records', async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', 'non-existent-id')
        .single()

      expect(error).toBeDefined()
      expect(data).toBeNull()
    })

    it('should handle invalid column queries', async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('non_existent_column')

      expect(error).toBeDefined()
      expect(data).toBeNull()
    })

    it('should handle malformed queries', async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', null)

      expect(error).toBeDefined()
      expect(data).toBeNull()
    })
  })
}) 