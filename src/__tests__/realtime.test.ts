import { createTestClient, generateTestUser, cleanupTestData, setupTestUser, delay } from './utils/supabase-test-utils'

describe('Real-time Subscription Tests', () => {
  const supabase = createTestClient()
  let testUser: ReturnType<typeof generateTestUser>

  beforeEach(async () => {
    testUser = await setupTestUser(supabase)
  })

  afterEach(async () => {
    await cleanupTestData(supabase)
  })

  describe('Channel Management', () => {
    it('should create and subscribe to a channel', async () => {
      const channel = supabase.channel('test-channel')
      
      const subscriptionPromise = new Promise<void>((resolve, reject) => {
        channel
          .on('presence', { event: 'sync' }, () => {
            expect(channel.presenceState()).toBeDefined()
            resolve()
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              resolve()
            } else if (status === 'CHANNEL_ERROR') {
              reject(new Error('Channel subscription failed'))
            }
          })
      })

      await expect(subscriptionPromise).resolves.not.toThrow()
      await channel.unsubscribe()
    })

    it('should handle channel errors', async () => {
      const channel = supabase.channel('invalid-channel-name!@#$')
      
      const subscriptionPromise = new Promise<void>((resolve, reject) => {
        channel.subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            resolve()
          }
        })
      })

      await expect(subscriptionPromise).resolves.not.toThrow()
      await channel.unsubscribe()
    })

    it('should unsubscribe from channel', async () => {
      const channel = supabase.channel('test-channel')
      
      await new Promise<void>((resolve) => {
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            resolve()
          }
        })
      })

      await channel.unsubscribe()
      expect(channel.state).toBe('closed')
    })
  })

  describe('Database Changes', () => {
    it('should receive INSERT notifications', async () => {
      const channel = supabase.channel('db-changes')
      
      const notificationPromise = new Promise<void>((resolve) => {
        channel
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'tenants',
            },
            (payload) => {
              expect(payload.new).toBeDefined()
              expect(payload.new.name).toBe('Test Tenant')
              resolve()
            }
          )
          .subscribe()
      })

      await delay(1000) // Wait for subscription to be established

      await supabase
        .from('tenants')
        .insert({ name: 'Test Tenant', slug: `test-${Date.now()}` })

      await expect(notificationPromise).resolves.not.toThrow()
      await channel.unsubscribe()
    })

    it('should receive UPDATE notifications', async () => {
      const channel = supabase.channel('db-changes')
      const { data: tenant } = await supabase
        .from('tenants')
        .insert({ name: 'Test Tenant', slug: `test-${Date.now()}` })
        .select()
        .single()

      const tenantId = tenant!.id

      const notificationPromise = new Promise<void>((resolve) => {
        channel
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'tenants',
              filter: `id=eq.${tenantId}`,
            },
            (payload) => {
              expect(payload.new.name).toBe('Updated Tenant')
              expect(payload.old.name).toBe('Test Tenant')
              resolve()
            }
          )
          .subscribe()
      })

      await delay(1000) // Wait for subscription to be established

      await supabase
        .from('tenants')
        .update({ name: 'Updated Tenant' })
        .eq('id', tenantId)

      await expect(notificationPromise).resolves.not.toThrow()
      await channel.unsubscribe()
    })

    it('should receive DELETE notifications', async () => {
      const channel = supabase.channel('db-changes')
      const { data: tenant } = await supabase
        .from('tenants')
        .insert({ name: 'Test Tenant', slug: `test-${Date.now()}` })
        .select()
        .single()

      const tenantId = tenant!.id

      const notificationPromise = new Promise<void>((resolve) => {
        channel
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'tenants',
              filter: `id=eq.${tenantId}`,
            },
            (payload) => {
              expect(payload.old.id).toBe(tenantId)
              resolve()
            }
          )
          .subscribe()
      })

      await delay(1000) // Wait for subscription to be established

      await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId)

      await expect(notificationPromise).resolves.not.toThrow()
      await channel.unsubscribe()
    })
  })

  describe('Presence', () => {
    it('should track user presence', async () => {
      const channel = supabase.channel('room-1')

      const presencePromise = new Promise<void>((resolve) => {
        channel
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState()
            expect(Object.keys(state)).toHaveLength(1)
            resolve()
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await channel.track({ user_id: testUser.email })
            }
          })
      })

      await expect(presencePromise).resolves.not.toThrow()
      await channel.unsubscribe()
    })

    it('should handle multiple users', async () => {
      const channel = supabase.channel('room-1')
      let syncCount = 0

      const presencePromise = new Promise<void>((resolve) => {
        channel
          .on('presence', { event: 'sync' }, () => {
            syncCount++
            if (syncCount === 2) {
              const state = channel.presenceState()
              expect(Object.keys(state)).toHaveLength(2)
              resolve()
            }
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await channel.track({ user_id: testUser.email })
              await channel.track({ user_id: 'another-user' })
            }
          })
      })

      await expect(presencePromise).resolves.not.toThrow()
      await channel.unsubscribe()
    })

    it('should handle user leave', async () => {
      const channel = supabase.channel('room-1')
      let syncCount = 0

      const presencePromise = new Promise<void>((resolve) => {
        channel
          .on('presence', { event: 'sync' }, () => {
            syncCount++
            if (syncCount === 2) {
              const state = channel.presenceState()
              expect(Object.keys(state)).toHaveLength(0)
              resolve()
            }
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await channel.track({ user_id: testUser.email })
              await channel.untrack()
            }
          })
      })

      await expect(presencePromise).resolves.not.toThrow()
      await channel.unsubscribe()
    })
  })

  describe('Broadcast', () => {
    it('should send and receive broadcast messages', async () => {
      const channel = supabase.channel('room-1')

      const messagePromise = new Promise<void>((resolve) => {
        channel
          .on('broadcast', { event: 'test-event' }, (payload) => {
            expect(payload).toEqual({ message: 'test message' })
            resolve()
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              channel.send({
                type: 'broadcast',
                event: 'test-event',
                payload: { message: 'test message' },
              })
            }
          })
      })

      await expect(messagePromise).resolves.not.toThrow()
      await channel.unsubscribe()
    })

    it('should handle multiple subscribers', async () => {
      const channel1 = supabase.channel('room-1')
      const channel2 = supabase.channel('room-1')
      let receivedCount = 0

      const messagePromise = new Promise<void>((resolve) => {
        const messageHandler = () => {
          receivedCount++
          if (receivedCount === 2) {
            resolve()
          }
        }

        channel1
          .on('broadcast', { event: 'test-event' }, messageHandler)
          .subscribe()

        channel2
          .on('broadcast', { event: 'test-event' }, messageHandler)
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              channel2.send({
                type: 'broadcast',
                event: 'test-event',
                payload: { message: 'test message' },
              })
            }
          })
      })

      await expect(messagePromise).resolves.not.toThrow()
      await Promise.all([channel1.unsubscribe(), channel2.unsubscribe()])
    })
  })
}) 