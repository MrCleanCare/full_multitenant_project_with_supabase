import { createTestClient, generateTestUser, cleanupTestData, waitForAuth, setupTestUser } from './utils/supabase-test-utils'

describe('Authentication Tests', () => {
  const supabase = createTestClient()
  let testUser: ReturnType<typeof generateTestUser>

  beforeEach(() => {
    testUser = generateTestUser()
  })

  afterEach(async () => {
    await cleanupTestData(supabase)
  })

  describe('Sign Up', () => {
    it('should successfully sign up a new user', async () => {
      const { data, error } = await supabase.auth.signUp({
        email: testUser.email,
        password: testUser.password,
      })

      expect(error).toBeNull()
      expect(data.user).toBeTruthy()
      expect(data.user?.email).toBe(testUser.email)
    })

    it('should prevent duplicate email signup', async () => {
      // First signup
      await supabase.auth.signUp({
        email: testUser.email,
        password: testUser.password,
      })

      // Try to signup again with same email
      const { error } = await supabase.auth.signUp({
        email: testUser.email,
        password: 'different-password',
      })

      expect(error).toBeTruthy()
    })

    it('should validate password strength', async () => {
      const { error } = await supabase.auth.signUp({
        email: testUser.email,
        password: '123', // Too short
      })

      expect(error).toBeTruthy()
    })

    it('should validate email format', async () => {
      const { error } = await supabase.auth.signUp({
        email: 'invalid-email',
        password: testUser.password,
      })

      expect(error).toBeTruthy()
    })
  })

  describe('Sign In', () => {
    beforeEach(async () => {
      await setupTestUser(supabase)
    })

    it('should successfully sign in with correct credentials', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password,
      })

      expect(error).toBeNull()
      expect(data.user).toBeTruthy()
      expect(data.session).toBeTruthy()
    })

    it('should fail with incorrect password', async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: 'wrong-password',
      })

      expect(error).toBeTruthy()
    })

    it('should fail with non-existent email', async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'nonexistent@example.com',
        password: testUser.password,
      })

      expect(error).toBeTruthy()
    })

    it('should handle rate limiting', async () => {
      const attempts = Array(10).fill(null).map(() =>
        supabase.auth.signInWithPassword({
          email: testUser.email,
          password: 'wrong-password',
        })
      )

      const results = await Promise.all(attempts)
      const hasRateLimit = results.some(r => r.error?.message.includes('rate limit'))
      expect(hasRateLimit).toBeTruthy()
    })
  })

  describe('Session Management', () => {
    beforeEach(async () => {
      await setupTestUser(supabase)
    })

    it('should get current session', async () => {
      await waitForAuth(supabase)
      const { data: { session }, error } = await supabase.auth.getSession()
      expect(error).toBeNull()
      expect(session).toBeTruthy()
    })

    it('should get current user', async () => {
      await waitForAuth(supabase)
      const { data: { user }, error } = await supabase.auth.getUser()
      expect(error).toBeNull()
      expect(user?.email).toBe(testUser.email)
    })

    it('should refresh session', async () => {
      await waitForAuth(supabase)
      const { data: { session }, error } = await supabase.auth.refreshSession()
      expect(error).toBeNull()
      expect(session).toBeTruthy()
    })

    it('should sign out successfully', async () => {
      await waitForAuth(supabase)
      const { error } = await supabase.auth.signOut()
      expect(error).toBeNull()

      const { data: { session } } = await supabase.auth.getSession()
      expect(session).toBeNull()
    })
  })

  describe('Password Reset', () => {
    beforeEach(async () => {
      await setupTestUser(supabase)
    })

    it('should send reset password email', async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(testUser.email)
      expect(error).toBeNull()
    })

    it('should handle non-existent email for reset', async () => {
      const { error } = await supabase.auth.resetPasswordForEmail('nonexistent@example.com')
      expect(error).toBeTruthy()
    })
  })

  describe('OAuth', () => {
    it('should generate OAuth URL', async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
        }
      })
      expect(error).toBeNull()
      expect(data.url).toBeTruthy()
    })

    it('should handle invalid OAuth provider', async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        // @ts-ignore - Testing invalid provider
        provider: 'invalid-provider',
      })
      expect(error).toBeTruthy()
    })
  })
}) 