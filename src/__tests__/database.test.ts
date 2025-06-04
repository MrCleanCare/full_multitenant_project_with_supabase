import { createTestClient } from './utils/supabase-test-utils'

describe('Database Connection Tests', () => {
  const supabase = createTestClient()

  it('should connect to Supabase successfully', async () => {
    const { data, error } = await supabase.from('tenants').select('*').single()
    expect(error).toBeNull()
    expect(data).toBeDefined()
  })

  it('should handle connection timeout', async () => {
    const startTime = Date.now()
    const { data, error } = await Promise.race([
      supabase.from('tenants').select('*').single(),
      new Promise(resolve => setTimeout(() => resolve({ data: null, error: { message: 'Timeout' } }), 5000))
    ])
    const endTime = Date.now()
    const duration = endTime - startTime

    expect(duration).toBeLessThan(5000)
    if (error) {
      expect(error.message).toBe('Timeout')
    }
  })

  it('should handle invalid table name', async () => {
    const { data, error } = await supabase.from('non_existent_table').select('*').single()
    expect(error).toBeDefined()
    expect(data).toBeNull()
  })

  it('should handle invalid column name', async () => {
    const { data, error } = await supabase.from('tenants').select('non_existent_column').single()
    expect(error).toBeDefined()
    expect(data).toBeNull()
  })

  it('should respect rate limits', async () => {
    const promises = Array(100).fill(null).map(() => 
      supabase.from('tenants').select('*').single()
    )

    const results = await Promise.allSettled(promises)
    const rejected = results.filter(r => r.status === 'rejected')
    expect(rejected.length).toBeGreaterThan(0)
  })
}) 