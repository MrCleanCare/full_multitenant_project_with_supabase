require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testSetup() {
    try {
        console.log('🔍 Testing Supabase Setup...\n');

        // Generate a unique slug using timestamp
        const uniqueSlug = `test-tenant-${Date.now()}`;

        // Test tenant creation
        console.log('Testing tenant creation...');
        const { data: tenant, error: tenantError } = await supabaseAdmin
            .from('tenants')
            .insert({
                name: 'Test Tenant',
                slug: uniqueSlug,
                settings: { theme: 'light' },
                subscription_tier: 'basic'
            })
            .select()
            .single();

        if (tenantError) {
            console.error('❌ Tenant creation failed:', tenantError.message);
            return;
        }
        console.log('✅ Tenant created:', tenant.id);

        // Create a test user
        console.log('\nCreating test user...');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email: `test-${Date.now()}@example.com`,
            password: 'test123456',
            email_confirm: true
        });

        if (userError) {
            console.error('❌ User creation failed:', userError.message);
            return;
        }
        console.log('✅ User created:', user.id);

        // Test profile creation
        console.log('\nTesting profile creation...');
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: user.id,
                email: user.email,
                full_name: 'Test User'
            })
            .select()
            .single();

        if (profileError) {
            console.error('❌ Profile creation failed:', profileError.message);
            return;
        }
        console.log('✅ Profile created:', profile.id);

        // Test tenant-user link
        console.log('\nTesting tenant-user link...');
        const { error: linkError } = await supabaseAdmin
            .from('tenant_users')
            .insert({
                tenant_id: tenant.id,
                user_id: user.id,
                role: 'admin'
            });

        if (linkError) {
            console.error('❌ Tenant-user link failed:', linkError.message);
            return;
        }
        console.log('✅ Tenant-user link created');

        // Test template creation
        console.log('\nTesting template creation...');
        const { data: template, error: templateError } = await supabaseAdmin
            .from('templates')
            .insert({
                tenant_id: tenant.id,
                name: 'Test Template',
                description: 'A test template',
                content: { blocks: [] },
                is_public: true
            })
            .select()
            .single();

        if (templateError) {
            console.error('❌ Template creation failed:', templateError.message);
            return;
        }
        console.log('✅ Template created:', template.id);

        console.log('\n✨ All tests passed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.hint) {
            console.error('Hint:', error.hint);
        }
        if (error.details) {
            console.error('Details:', error.details);
        }
    }
}

// Run the tests
testSetup(); 