import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { generateSlug } from '../src/lib/utils.js'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'test123!',
    role: 'admin',
  },
  user: {
    email: 'user@test.com',
    password: 'test123!',
    role: 'user',
  },
}

async function cleanupTestData() {
  const { data: users } = await supabase
    .from('auth.users')
    .select('id')
    .in('email', [testUsers.admin.email, testUsers.user.email])

  if (users?.length) {
    await Promise.all(
      users.map(async (user) => {
        await supabase.auth.admin.deleteUser(user.id)
      })
    )
  }
}

async function createTestUser(userData) {
  const { data: { user }, error } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true,
  })

  if (error) throw error

  // Create profile
  await supabase.from('profiles').insert({
    id: user.id,
    full_name: `Test ${userData.role}`,
  })

  return user
}

async function runTests() {
  console.log('Starting Supabase integration tests...\n')

  try {
    // Clean up any existing test data
    await cleanupTestData()

    // Test 1: Creating test users
    console.log('Test 1: Creating test users...')
    const adminUser = await createTestUser(testUsers.admin)
    console.log('✓ Admin user created successfully')
    
    const regularUser = await createTestUser(testUsers.user)
    console.log('✓ Regular user created successfully\n')

    // Test 2: Testing profile management
    console.log('Test 2: Testing profile management...')
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', [adminUser.id, regularUser.id])

    if (profiles.length !== 2) throw new Error('Profiles not created correctly')
    console.log('✓ Profiles created successfully\n')

    // Test 3: Testing authentication
    console.log('Test 3: Testing authentication...')
    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
      email: testUsers.admin.email,
      password: testUsers.admin.password,
    })

    if (authError) throw authError
    console.log('✓ Admin signed in successfully\n')

    // Test 4: Testing profile updates
    console.log('Test 4: Testing profile updates...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: 'Updated Admin Name' })
      .eq('id', adminUser.id)

    if (updateError) throw updateError
    console.log('✓ Profile updated successfully\n')

    // Test 5: Testing tenant management
    console.log('Test 5: Testing tenant management...')
    const testTenant = {
      name: 'Test Tenant',
      slug: generateSlug('Test Tenant'),
      owner_id: adminUser.id,
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert([testTenant])
      .select()
      .single()

    if (tenantError) throw tenantError
    console.log('✓ Tenant created successfully\n')

    // Test 6: Testing tenant user management
    console.log('Test 6: Testing tenant user management...')
    const { error: userError } = await supabase.from('tenant_users').insert([
      {
        tenant_id: tenant.id,
        user_id: adminUser.id,
        role: 'owner',
      },
      {
        tenant_id: tenant.id,
        user_id: regularUser.id,
        role: 'member',
      },
    ])

    if (userError) throw userError
    console.log('✓ Users linked to tenant successfully\n')

    // Test 7: Testing tenant updates
    console.log('Test 7: Testing tenant updates...')
    const { error: updateTenantError } = await supabase
      .from('tenants')
      .update({ name: 'Updated Test Tenant' })
      .eq('id', tenant.id)

    if (updateTenantError) throw updateTenantError
    console.log('✓ Tenant updated successfully\n')

    // Test 8: Testing template management
    console.log('Test 8: Testing template management...')
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .insert([
        {
          tenant_id: tenant.id,
          name: 'Test Template',
          content: 'Test content',
          created_by: adminUser.id,
        },
      ])
      .select()
      .single()

    if (templateError) throw templateError
    console.log('✓ Template created successfully')

    const { error: updateTemplateError } = await supabase
      .from('templates')
      .update({ content: 'Updated content' })
      .eq('id', template.id)

    if (updateTemplateError) throw updateTemplateError
    console.log('✓ Template updated successfully\n')

    // Test 9: Testing error cases
    console.log('Test 9: Testing error cases...')
    const duplicateSlugError = await supabase
      .from('tenants')
      .insert([{ ...testTenant, owner_id: regularUser.id }])
      .then(() => false)
      .catch(() => true)

    if (!duplicateSlugError) throw new Error('Duplicate slug prevention failed')
    console.log('✓ Duplicate slug prevention working')

    const unauthorizedAccess = await supabase
      .auth.signInWithPassword({
        email: testUsers.user.email,
        password: testUsers.user.password,
      })
      .then(async () => {
        return await supabase
          .from('tenants')
          .update({ name: 'Unauthorized Update' })
          .eq('id', tenant.id)
          .then(() => false)
          .catch(() => true)
      })

    if (!unauthorizedAccess) throw new Error('Unauthorized access prevention failed')
    console.log('✓ Unauthorized access prevention working\n')

    // Test 10: Testing role-based access
    console.log('Test 10: Testing role-based access...')
    console.log('Testing unauthorized tenant update...')
    const { error: unauthorizedUpdateError } = await supabase
      .from('tenants')
      .update({ name: 'Unauthorized Update' })
      .eq('id', tenant.id)

    if (!unauthorizedUpdateError) {
      throw new Error('Expected error for unauthorized tenant update')
    }
    console.log('✓ Tenant update protection working')

    console.log('Testing tenant creation as regular user...')
    const { error: regularUserTenantError } = await supabase
      .from('tenants')
      .insert([
        {
          name: 'Regular User Tenant',
          slug: generateSlug('Regular User Tenant'),
          owner_id: regularUser.id,
        },
      ])

    if (regularUserTenantError) {
      console.log('\n❌ Test failed: Regular user could not create tenant:', regularUserTenantError.message)
    } else {
      console.log('✓ Regular user can create tenants')
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
  } finally {
    await cleanupTestData()
  }
}

runTests() 