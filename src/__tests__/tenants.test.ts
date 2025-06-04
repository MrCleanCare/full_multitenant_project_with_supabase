import { SupabaseClient } from '@supabase/supabase-js'
import { createTestClient, generateTestUser, setupTestUser } from './utils/supabase-test-utils'
import type { Database } from '@/types/supabase'

describe('Tenant Operations Tests', () => {
  const supabase = createTestClient() as SupabaseClient<Database>
  let testUser: ReturnType<typeof generateTestUser>

  beforeEach(async () => {
    testUser = await setupTestUser(supabase)
  })

  describe('Tenant Creation', () => {
    it('should create a new tenant', async () => {
      const tenantData = {
        name: 'Test Tenant',
        slug: `test-${Date.now()}`,
        created_by: testUser.email,
      }

      const { data, error } = await supabase
        .from('tenants')
        .insert(tenantData)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      if (data) {
        expect(data.name).toBe(tenantData.name)
        expect(data.slug).toBe(tenantData.slug)
      }
    })

    it('should prevent duplicate slug creation', async () => {
      const slug = `test-${Date.now()}`
      const tenant1 = {
        name: 'Test Tenant 1',
        slug,
        created_by: testUser.email,
      }

      const tenant2 = {
        name: 'Test Tenant 2',
        slug,
        created_by: testUser.email,
      }

      await supabase.from('tenants').insert(tenant1).single()
      const { error } = await supabase.from('tenants').insert(tenant2).single()

      expect(error).toBeTruthy()
    })

    it('should validate required fields', async () => {
      const { error } = await supabase
        .from('tenants')
        .insert({ name: 'Missing Slug' })
        .single()

      expect(error).toBeTruthy()
    })

    it('should sanitize tenant slug', async () => {
      const tenantData = {
        name: 'Test Tenant',
        slug: 'Test Slug With Spaces!@#$',
        created_by: testUser.email,
      }

      const { data, error } = await supabase
        .from('tenants')
        .insert(tenantData)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      if (data) {
        expect(data.slug).toBe('test-slug-with-spaces')
      }
    })
  })

  describe('Tenant-User Associations', () => {
    let testTenant: Database['public']['Tables']['tenants']['Row']

    beforeEach(async () => {
      const { data: tenant } = await supabase
        .from('tenants')
        .insert({
          name: 'Test Tenant',
          slug: `test-tenant-${Date.now()}`,
          created_by: testUser.email,
        })
        .single()

      testTenant = tenant!
    })

    it('should associate user with tenant', async () => {
      const { error } = await supabase
        .from('user_tenants')
        .insert({
          user_id: testUser.email,
          tenant_id: testTenant.id,
          role: 'member',
        })
        .single()

      expect(error).toBeNull()
    })

    it('should prevent duplicate user-tenant associations', async () => {
      await supabase
        .from('user_tenants')
        .insert({
          user_id: testUser.email,
          tenant_id: testTenant.id,
          role: 'member',
        })
        .single()

      const { error } = await supabase
        .from('user_tenants')
        .insert({
          user_id: testUser.email,
          tenant_id: testTenant.id,
          role: 'member',
        })
        .single()

      expect(error).toBeTruthy()
    })

    it('should validate role values', async () => {
      const { error } = await supabase
        .from('user_tenants')
        .insert({
          user_id: testUser.email,
          tenant_id: testTenant.id,
          role: 'invalid-role',
        })
        .single()

      expect(error).toBeTruthy()
    })

    it('should allow role updates', async () => {
      await supabase
        .from('user_tenants')
        .insert({
          user_id: testUser.email,
          tenant_id: testTenant.id,
          role: 'member',
        })
        .single()

      const { error } = await supabase
        .from('user_tenants')
        .update({ role: 'admin' })
        .match({ user_id: testUser.email, tenant_id: testTenant.id })
        .single()

      expect(error).toBeNull()
    })
  })

  describe('RLS Policies', () => {
    let testTenant: Database['public']['Tables']['tenants']['Row']

    beforeEach(async () => {
      const { data: tenant } = await supabase
        .from('tenants')
        .insert({
          name: 'Test Tenant',
          slug: `test-tenant-${Date.now()}`,
          created_by: testUser.email,
        })
        .single()

      testTenant = tenant!
    })

    it('should enforce tenant isolation', async () => {
      const otherUser = await setupTestUser(supabase)
      const { error } = await supabase
        .from('tenants')
        .select('*')
        .match({ id: testTenant.id })
        .single()

      expect(error).toBeTruthy()
    })

    it('should allow tenant access for associated users', async () => {
      await supabase
        .from('user_tenants')
        .insert({
          user_id: testUser.email,
          tenant_id: testTenant.id,
          role: 'member',
        })
        .single()

      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .match({ id: testTenant.id })
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should enforce role-based access control', async () => {
      await supabase
        .from('user_tenants')
        .insert({
          user_id: testUser.email,
          tenant_id: testTenant.id,
          role: 'member',
        })
        .single()

      const { error } = await supabase
        .from('tenants')
        .update({ name: 'Updated Name' })
        .match({ id: testTenant.id })
        .single()

      expect(error).toBeTruthy()
    })

    it('should allow admin operations', async () => {
      await supabase
        .from('user_tenants')
        .insert({
          user_id: testUser.email,
          tenant_id: testTenant.id,
          role: 'admin',
        })
        .single()

      const { error } = await supabase
        .from('tenants')
        .update({ name: 'Updated Name' })
        .match({ id: testTenant.id })
        .single()

      expect(error).toBeNull()
    })
  })

  describe('Tenant Management', () => {
    let testTenant: Database['public']['Tables']['tenants']['Row']

    beforeEach(async () => {
      const { data: tenant } = await supabase
        .from('tenants')
        .insert({
          name: 'Test Tenant',
          slug: `test-tenant-${Date.now()}`,
          created_by: testUser.email,
        })
        .single()

      testTenant = tenant!
    })

    it('should update tenant details', async () => {
      const { error } = await supabase
        .from('tenants')
        .update({ name: 'Updated Name' })
        .match({ id: testTenant.id })
        .single()

      expect(error).toBeNull()
    })

    it('should delete tenant', async () => {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .match({ id: testTenant.id })
        .single()

      expect(error).toBeNull()
    })

    it('should cascade delete user associations', async () => {
      await supabase
        .from('user_tenants')
        .insert({
          user_id: testUser.email,
          tenant_id: testTenant.id,
          role: 'member',
        })
        .single()

      await supabase
        .from('tenants')
        .delete()
        .match({ id: testTenant.id })
        .single()

      const { data, error } = await supabase
        .from('user_tenants')
        .select('*')
        .match({ tenant_id: testTenant.id })
        .single()

      expect(error).toBeNull()
      expect(data).toBeNull()
    })

    it('should handle concurrent updates', async () => {
      const updates = Array(5).fill(null).map((_, i) => 
        supabase
          .from('tenants')
          .update({ name: `Updated Name ${i}` })
          .match({ id: testTenant.id })
          .single()
      )

      const results = await Promise.all(updates)
      const errors = results.filter(r => r.error)
      expect(errors.length).toBeGreaterThan(0)
    })
  })
}) 