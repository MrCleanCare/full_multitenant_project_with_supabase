import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

let supabaseInstance: SupabaseClient<Database> | null = null

// Mock responses
const mockResponses = {
  signUp: {
    data: {
      user: {
        id: 'test-user-id',
        email: '',
        role: 'authenticated',
      },
      session: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
      },
    },
    error: null,
  },
  signIn: {
    data: {
      user: {
        id: 'test-user-id',
        email: '',
        role: 'authenticated',
      },
      session: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
      },
    },
    error: null,
  },
  getUser: {
    data: {
      user: {
        id: 'test-user-id',
        email: '',
        role: 'authenticated',
      },
    },
    error: null,
  },
  getSession: {
    data: {
      session: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
      },
    },
    error: null,
  },
}

// Mock database data
const mockData = {
  tenants: [] as Database['public']['Tables']['tenants']['Row'][],
  user_tenants: [] as Database['public']['Tables']['user_tenants']['Row'][],
  usedEmails: new Set<string>(),
  usedSlugs: new Set<string>(),
  rateLimitCounter: 0,
  storage: {
    buckets: new Set<string>(),
    files: new Map<string, Map<string, Buffer>>(),
  },
}

const createQueryBuilder = <T extends keyof Database['public']['Tables']>(table: T) => {
  let queryState = {
    table,
    filters: {} as Record<string, any>,
    order: [] as { column: string; ascending: boolean }[],
    range: { start: 0, end: 1000 },
    returning: false,
  }

  const builder = {
    select: jest.fn((columns?: string) => {
      queryState.returning = true
      return builder
    }),
    insert: jest.fn((data: Database['public']['Tables'][T]['Insert']) => {
      // Handle rate limiting
      mockData.rateLimitCounter++
      if (mockData.rateLimitCounter > 50) {
        return Promise.resolve({
          data: null,
          error: { message: 'Rate limit exceeded' },
        })
      }

      // Handle tenant creation
      if (table === 'tenants') {
        const tenantData = data as Database['public']['Tables']['tenants']['Insert']
        if (!tenantData.name || !tenantData.slug) {
          return Promise.resolve({
            data: null,
            error: { message: 'Missing required fields' },
          })
        }

        if (mockData.usedSlugs.has(tenantData.slug)) {
          return Promise.resolve({
            data: null,
            error: { message: 'Slug already exists' },
          })
        }

        const newTenant = {
          id: `test-${Date.now()}`,
          created_at: new Date().toISOString(),
          ...tenantData,
        } as Database['public']['Tables']['tenants']['Row']

        mockData.tenants.push(newTenant)
        mockData.usedSlugs.add(tenantData.slug)
        return Promise.resolve({
          data: newTenant,
          error: null,
        })
      }

      // Handle user-tenant associations
      if (table === 'user_tenants') {
        const userTenantData = data as Database['public']['Tables']['user_tenants']['Insert']

        if (mockData.user_tenants.some(ut => 
          ut.user_id === userTenantData.user_id && 
          ut.tenant_id === userTenantData.tenant_id
        )) {
          return Promise.resolve({
            data: null,
            error: { message: 'Association already exists' },
          })
        }

        if (!['admin', 'member'].includes(userTenantData.role)) {
          return Promise.resolve({
            data: null,
            error: { message: 'Invalid role' },
          })
        }

        const newUserTenant = {
          id: `test-${Date.now()}`,
          created_at: new Date().toISOString(),
          ...userTenantData,
        } as Database['public']['Tables']['user_tenants']['Row']

        mockData.user_tenants.push(newUserTenant)
        return Promise.resolve({
          data: newUserTenant,
          error: null,
        })
      }

      return Promise.resolve({
        data: null,
        error: { message: 'Table not implemented' },
      })
    }),
    update: jest.fn((data: Partial<Database['public']['Tables'][T]['Update']>) => {
      if (table === 'tenants') {
        const index = mockData.tenants.findIndex(t => 
          Object.entries(queryState.filters).every(([key, value]) => t[key] === value)
        )
        
        if (index === -1) {
          return Promise.resolve({
            data: null,
            error: { message: 'Record not found' },
          })
        }

        mockData.tenants[index] = {
          ...mockData.tenants[index],
          ...data,
          updated_at: new Date().toISOString(),
        }

        return Promise.resolve({
          data: mockData.tenants[index],
          error: null,
        })
      }

      if (table === 'user_tenants') {
        const index = mockData.user_tenants.findIndex(ut => 
          Object.entries(queryState.filters).every(([key, value]) => ut[key] === value)
        )
        
        if (index === -1) {
          return Promise.resolve({
            data: null,
            error: { message: 'Record not found' },
          })
        }

        mockData.user_tenants[index] = {
          ...mockData.user_tenants[index],
          ...data,
        }

        return Promise.resolve({
          data: mockData.user_tenants[index],
          error: null,
        })
      }

      return Promise.resolve({
        data: null,
        error: { message: 'Table not implemented' },
      })
    }),
    delete: jest.fn(() => {
      if (table === 'tenants') {
        const index = mockData.tenants.findIndex(t => 
          Object.entries(queryState.filters).every(([key, value]) => t[key] === value)
        )
        
        if (index === -1) {
          return Promise.resolve({
            data: null,
            error: { message: 'Record not found' },
          })
        }

        const deleted = mockData.tenants.splice(index, 1)[0]

        // Cascade delete user associations
        mockData.user_tenants = mockData.user_tenants.filter(ut => ut.tenant_id !== deleted.id)

        return Promise.resolve({
          data: deleted,
          error: null,
        })
      }

      if (table === 'user_tenants') {
        const index = mockData.user_tenants.findIndex(ut => 
          Object.entries(queryState.filters).every(([key, value]) => ut[key] === value)
        )
        
        if (index === -1) {
          return Promise.resolve({
            data: null,
            error: { message: 'Record not found' },
          })
        }

        const deleted = mockData.user_tenants.splice(index, 1)[0]

        return Promise.resolve({
          data: deleted,
          error: null,
        })
      }

      return Promise.resolve({
        data: null,
        error: { message: 'Table not implemented' },
      })
    }),
    eq: jest.fn((column: string, value: any) => {
      queryState.filters[column] = value
      return builder
    }),
    neq: jest.fn((column: string, value: any) => {
      queryState.filters[`${column}!`] = value
      return builder
    }),
    gt: jest.fn((column: string, value: any) => {
      queryState.filters[`${column}>`] = value
      return builder
    }),
    gte: jest.fn((column: string, value: any) => {
      queryState.filters[`${column}>=`] = value
      return builder
    }),
    lt: jest.fn((column: string, value: any) => {
      queryState.filters[`${column}<`] = value
      return builder
    }),
    lte: jest.fn((column: string, value: any) => {
      queryState.filters[`${column}<=`] = value
      return builder
    }),
    match: jest.fn((filters: Record<string, any>) => {
      queryState.filters = { ...queryState.filters, ...filters }
      return builder
    }),
    order: jest.fn((column: string, { ascending = true } = {}) => {
      queryState.order.push({ column, ascending })
      return builder
    }),
    range: jest.fn((start: number, end: number) => {
      queryState.range = { start, end }
      return builder
    }),
    single: jest.fn(() => {
      if (table === 'tenants') {
        const tenant = mockData.tenants.find(t => 
          Object.entries(queryState.filters).every(([key, value]) => t[key] === value)
        )

        return Promise.resolve({
          data: tenant || null,
          error: null,
        })
      }

      if (table === 'user_tenants') {
        const userTenant = mockData.user_tenants.find(ut => 
          Object.entries(queryState.filters).every(([key, value]) => ut[key] === value)
        )

        return Promise.resolve({
          data: userTenant || null,
          error: null,
        })
      }

      return Promise.resolve({
        data: null,
        error: { message: 'Table not implemented' },
      })
    }),
    execute: jest.fn(() => {
      if (table === 'tenants') {
        let results = [...mockData.tenants]

        // Apply filters
        results = results.filter(record => 
          Object.entries(queryState.filters).every(([key, value]) => {
            if (key.endsWith('!')) {
              return record[key.slice(0, -1)] !== value
            }
            if (key.endsWith('>')) {
              return record[key.slice(0, -1)] > value
            }
            if (key.endsWith('>=')) {
              return record[key.slice(0, -2)] >= value
            }
            if (key.endsWith('<')) {
              return record[key.slice(0, -1)] < value
            }
            if (key.endsWith('<=')) {
              return record[key.slice(0, -2)] <= value
            }
            return record[key] === value
          })
        )

        // Apply ordering
        for (const { column, ascending } of queryState.order.reverse()) {
          results.sort((a, b) => {
            if (ascending) {
              return a[column] > b[column] ? 1 : -1
            }
            return a[column] < b[column] ? 1 : -1
          })
        }

        // Apply pagination
        results = results.slice(queryState.range.start, queryState.range.end + 1)

        return Promise.resolve({
          data: results,
          error: null,
        })
      }

      if (table === 'user_tenants') {
        let results = [...mockData.user_tenants]

        // Apply filters
        results = results.filter(record => 
          Object.entries(queryState.filters).every(([key, value]) => record[key] === value)
        )

        // Apply ordering
        for (const { column, ascending } of queryState.order.reverse()) {
          results.sort((a, b) => {
            if (ascending) {
              return a[column] > b[column] ? 1 : -1
            }
            return a[column] < b[column] ? 1 : -1
          })
        }

        // Apply pagination
        results = results.slice(queryState.range.start, queryState.range.end + 1)

        return Promise.resolve({
          data: results,
          error: null,
        })
      }

      return Promise.resolve({
        data: [],
        error: { message: 'Table not implemented' },
      })
    }),
  }

  return builder
}

export const createTestClient = () => {
  if (supabaseInstance) {
    return supabaseInstance
  }

  const mockClient = {
    auth: {
      signUp: jest.fn(({ email, password }) => {
        if (mockData.usedEmails.has(email)) {
          return Promise.resolve({
            data: { user: null, session: null },
            error: { message: 'Email already registered' },
          })
        }

        if (password.length < 6) {
          return Promise.resolve({
            data: { user: null, session: null },
            error: { message: 'Password too weak' },
          })
        }

        if (!email.includes('@')) {
          return Promise.resolve({
            data: { user: null, session: null },
            error: { message: 'Invalid email format' },
          })
        }

        mockData.usedEmails.add(email)
        return Promise.resolve({
          data: {
            user: {
              id: `test-${Date.now()}`,
              email,
              role: 'authenticated',
            },
            session: {
              access_token: 'test-access-token',
              refresh_token: 'test-refresh-token',
              expires_in: 3600,
              token_type: 'bearer',
            },
          },
          error: null,
        })
      }),
      signInWithPassword: jest.fn(({ email, password }) => {
        if (!mockData.usedEmails.has(email)) {
          return Promise.resolve({
            data: { user: null, session: null },
            error: { message: 'Invalid credentials' },
          })
        }

        if (password !== 'Test123!@#') {
          return Promise.resolve({
            data: { user: null, session: null },
            error: { message: 'Invalid credentials' },
          })
        }

        return Promise.resolve({
          data: {
            user: {
              id: `test-${Date.now()}`,
              email,
              role: 'authenticated',
            },
            session: {
              access_token: 'test-access-token',
              refresh_token: 'test-refresh-token',
              expires_in: 3600,
              token_type: 'bearer',
            },
          },
          error: null,
        })
      }),
      getUser: jest.fn(() => {
        const email = Array.from(mockData.usedEmails)[0] || ''
        return Promise.resolve({
          data: {
            user: {
              id: `test-${Date.now()}`,
              email,
              role: 'authenticated',
            },
          },
          error: null,
        })
      }),
      getSession: jest.fn(() => Promise.resolve({
        data: {
          session: {
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
          },
        },
        error: null,
      })),
      refreshSession: jest.fn(() => Promise.resolve({
        data: {
          session: {
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
          },
        },
        error: null,
      })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      resetPasswordForEmail: jest.fn((email) => {
        if (!mockData.usedEmails.has(email)) {
          return Promise.resolve({ error: { message: 'Email not found' } })
        }
        return Promise.resolve({ error: null })
      }),
      signInWithOAuth: jest.fn(({ provider }) => {
        if (provider === 'invalid-provider') {
          return Promise.resolve({ error: { message: 'Invalid provider' } })
        }
        return Promise.resolve({
          data: { url: 'http://localhost:3000/auth/callback' },
          error: null,
        })
      }),
    },
    from: jest.fn((table: keyof Database['public']['Tables']) => {
      return createQueryBuilder(table)
    }),
    storage: {
      createBucket: jest.fn((name: string) => {
        if (mockData.storage.buckets.has(name)) {
          return Promise.resolve({
            data: null,
            error: { message: 'Bucket already exists' },
          })
        }
        mockData.storage.buckets.add(name)
        mockData.storage.files.set(name, new Map())
        return Promise.resolve({
          data: { name },
          error: null,
        })
      }),
      deleteBucket: jest.fn((name: string) => {
        if (!mockData.storage.buckets.has(name)) {
          return Promise.resolve({
            data: null,
            error: { message: 'Bucket not found' },
          })
        }
        mockData.storage.buckets.delete(name)
        mockData.storage.files.delete(name)
        return Promise.resolve({
          data: { name },
          error: null,
        })
      }),
      listBuckets: jest.fn(() => Promise.resolve({
        data: Array.from(mockData.storage.buckets).map(name => ({ name })),
        error: null,
      })),
      from: jest.fn((bucketName: string) => ({
        upload: jest.fn((path: string, file: Buffer) => {
          if (!mockData.storage.buckets.has(bucketName)) {
            return Promise.resolve({
              data: null,
              error: { message: 'Bucket not found' },
            })
          }

          const bucket = mockData.storage.files.get(bucketName)!
          if (bucket.has(path)) {
            return Promise.resolve({
              data: null,
              error: { message: 'File already exists' },
            })
          }

          if (path.endsWith('.exe')) {
            return Promise.resolve({
              data: null,
              error: { message: 'File type not allowed' },
            })
          }

          bucket.set(path, file)
          return Promise.resolve({
            data: { path },
            error: null,
          })
        }),
        download: jest.fn((path: string) => {
          if (!mockData.storage.buckets.has(bucketName)) {
            return Promise.resolve({
              data: null,
              error: { message: 'Bucket not found' },
            })
          }

          const bucket = mockData.storage.files.get(bucketName)!
          const file = bucket.get(path)
          if (!file) {
            return Promise.resolve({
              data: null,
              error: { message: 'File not found' },
            })
          }

          return Promise.resolve({
            data: file,
            error: null,
          })
        }),
        list: jest.fn(() => {
          if (!mockData.storage.buckets.has(bucketName)) {
            return Promise.resolve({
              data: null,
              error: { message: 'Bucket not found' },
            })
          }

          const bucket = mockData.storage.files.get(bucketName)!
          return Promise.resolve({
            data: Array.from(bucket.keys()).map(name => ({ name })),
            error: null,
          })
        }),
        move: jest.fn((from: string, to: string) => {
          if (!mockData.storage.buckets.has(bucketName)) {
            return Promise.resolve({
              data: null,
              error: { message: 'Bucket not found' },
            })
          }

          const bucket = mockData.storage.files.get(bucketName)!
          const file = bucket.get(from)
          if (!file) {
            return Promise.resolve({
              data: null,
              error: { message: 'File not found' },
            })
          }

          bucket.delete(from)
          bucket.set(to, file)
          return Promise.resolve({
            data: { path: to },
            error: null,
          })
        }),
        copy: jest.fn((from: string, to: string) => {
          if (!mockData.storage.buckets.has(bucketName)) {
            return Promise.resolve({
              data: null,
              error: { message: 'Bucket not found' },
            })
          }

          const bucket = mockData.storage.files.get(bucketName)!
          const file = bucket.get(from)
          if (!file) {
            return Promise.resolve({
              data: null,
              error: { message: 'File not found' },
            })
          }

          bucket.set(to, Buffer.from(file))
          return Promise.resolve({
            data: { path: to },
            error: null,
          })
        }),
        remove: jest.fn((path: string) => {
          if (!mockData.storage.buckets.has(bucketName)) {
            return Promise.resolve({
              data: null,
              error: { message: 'Bucket not found' },
            })
          }

          const bucket = mockData.storage.files.get(bucketName)!
          if (!bucket.has(path)) {
            return Promise.resolve({
              data: null,
              error: { message: 'File not found' },
            })
          }

          bucket.delete(path)
          return Promise.resolve({
            data: { path },
            error: null,
          })
        }),
      })),
    },
    channel: jest.fn((name) => ({
      name,
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn((callback) => {
        if (typeof callback === 'function') {
          setTimeout(() => callback('SUBSCRIBED'), 0)
        }
        return {
          unsubscribe: jest.fn(),
        }
      }),
      unsubscribe: jest.fn(),
      track: jest.fn(() => Promise.resolve()),
      untrack: jest.fn(() => Promise.resolve()),
      presenceState: jest.fn(() => ({})),
      send: jest.fn(),
    })),
  }

  supabaseInstance = mockClient as unknown as SupabaseClient<Database>
  return supabaseInstance
}

export const generateTestUser = () => ({
  email: `test-${Date.now()}@example.com`,
  password: 'Test123!@#',
})

export const cleanupTestData = async () => {
  // Reset mock responses
  Object.keys(mockResponses).forEach((key) => {
    if (mockResponses[key].data.user) {
      mockResponses[key].data.user.email = ''
    }
  })
  // Reset mock data
  mockData.tenants = []
  mockData.user_tenants = []
  mockData.usedEmails.clear()
  mockData.usedSlugs.clear()
  mockData.rateLimitCounter = 0
  mockData.storage.buckets.clear()
  mockData.storage.files.clear()
}

export const waitForAuth = async () => {
  return true
}

export const setupTestUser = async (supabase: SupabaseClient<Database>) => {
  const testUser = generateTestUser()
  
  await supabase.auth.signUp({
    email: testUser.email,
    password: testUser.password,
  })

  await supabase.auth.signInWithPassword({
    email: testUser.email,
    password: testUser.password,
  })

  return testUser
}

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms)) 