require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseAnonKey ? 'Present' : 'Missing')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      throw error
    }

    console.log('✅ Successfully connected to Supabase')
    
    // Try to query the database
    const { data: dbData, error: dbError } = await supabase
      .from('tenants')
      .select('*')
      .limit(1)
    
    if (dbError) {
      throw dbError
    }
    
    console.log('✅ Successfully queried the database')
    console.log('Data:', dbData)

  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    process.exit(1)
  }
}

testConnection() 