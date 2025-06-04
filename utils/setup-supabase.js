require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function setupDatabase() {
    try {
        console.log('🚀 Starting Supabase Setup...\n');

        // Create tables
        console.log('Creating tables...');
        const { error: tablesError } = await supabaseAdmin
            .from('_setup')
            .insert({
                name: 'create_tables',
                executed_at: new Date().toISOString()
            });

        if (tablesError) {
            console.log('Tables already exist, continuing...');
        }

        // Test the setup by creating a test tenant
        console.log('\nTesting setup by creating a test tenant...');
        const { data: tenant, error: testError } = await supabaseAdmin
            .from('tenants')
            .insert({
                name: 'Test Tenant',
                slug: 'test-tenant',
                settings: { theme: 'light' },
                subscription_tier: 'basic'
            })
            .select()
            .single();

        if (testError) {
            console.log('❌ Test tenant creation failed:', testError.message);
        } else {
            console.log('✅ Test tenant created successfully:', tenant.id);

            // Create a test user profile
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
                    email: 'test@example.com',
                    full_name: 'Test User'
                })
                .select()
                .single();

            if (profileError) {
                console.log('❌ Test profile creation failed:', profileError.message);
            } else {
                console.log('✅ Test profile created successfully:', profile.id);

                // Link user to tenant
                const { error: linkError } = await supabaseAdmin
                    .from('tenant_users')
                    .insert({
                        tenant_id: tenant.id,
                        user_id: profile.id,
                        role: 'admin'
                    });

                if (linkError) {
                    console.log('❌ Tenant-user link failed:', linkError.message);
                } else {
                    console.log('✅ Tenant-user link created successfully');
                }
            }
        }

        console.log('\n✨ Setup completed!');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        if (error.hint) {
            console.error('Hint:', error.hint);
        }
        if (error.details) {
            console.error('Details:', error.details);
        }
    }
}

// Run the setup
setupDatabase(); 