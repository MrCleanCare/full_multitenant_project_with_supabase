import { createTestClient, generateTestUser, cleanupTestData } from './utils/supabase-test-utils'

describe('Storage Operations Tests', () => {
  const supabase = createTestClient()
  let testUser: ReturnType<typeof generateTestUser>
  const testBucket = 'test-bucket'
  const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })

  beforeEach(async () => {
    testUser = generateTestUser()
    await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
    })
    await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    })
  })

  afterEach(async () => {
    await cleanupTestData(supabase)
    await supabase.auth.signOut()
  })

  describe('Bucket Operations', () => {
    it('should create a new bucket', async () => {
      const { data, error } = await supabase.storage.createBucket(testBucket, {
        public: false,
      })

      expect(error).toBeNull()
      expect(data).toBeTruthy()
    })

    it('should prevent duplicate bucket creation', async () => {
      await supabase.storage.createBucket(testBucket)
      const { error } = await supabase.storage.createBucket(testBucket)

      expect(error).toBeTruthy()
    })

    it('should list buckets', async () => {
      await supabase.storage.createBucket(testBucket)
      const { data, error } = await supabase.storage.listBuckets()

      expect(error).toBeNull()
      expect(data).toContainEqual(expect.objectContaining({ name: testBucket }))
    })

    it('should delete bucket', async () => {
      await supabase.storage.createBucket(testBucket)
      const { error } = await supabase.storage.deleteBucket(testBucket)

      expect(error).toBeNull()

      // Verify bucket is deleted
      const { data: buckets } = await supabase.storage.listBuckets()
      expect(buckets).not.toContainEqual(expect.objectContaining({ name: testBucket }))
    })
  })

  describe('File Operations', () => {
    beforeEach(async () => {
      await supabase.storage.createBucket(testBucket)
    })

    it('should upload file', async () => {
      const { data, error } = await supabase.storage
        .from(testBucket)
        .upload('test.txt', testFile)

      expect(error).toBeNull()
      expect(data).toBeTruthy()
    })

    it('should prevent duplicate file upload', async () => {
      await supabase.storage.from(testBucket).upload('test.txt', testFile)
      const { error } = await supabase.storage.from(testBucket).upload('test.txt', testFile)

      expect(error).toBeTruthy()
    })

    it('should list files', async () => {
      await supabase.storage.from(testBucket).upload('test.txt', testFile)
      const { data, error } = await supabase.storage.from(testBucket).list()

      expect(error).toBeNull()
      expect(data).toContainEqual(expect.objectContaining({ name: 'test.txt' }))
    })

    it('should download file', async () => {
      await supabase.storage.from(testBucket).upload('test.txt', testFile)
      const { data, error } = await supabase.storage.from(testBucket).download('test.txt')

      expect(error).toBeNull()
      expect(data).toBeTruthy()
    })

    it('should move file', async () => {
      await supabase.storage.from(testBucket).upload('test.txt', testFile)
      const { error } = await supabase.storage
        .from(testBucket)
        .move('test.txt', 'moved.txt')

      expect(error).toBeNull()

      // Verify file was moved
      const { data: files } = await supabase.storage.from(testBucket).list()
      expect(files).toContainEqual(expect.objectContaining({ name: 'moved.txt' }))
      expect(files).not.toContainEqual(expect.objectContaining({ name: 'test.txt' }))
    })

    it('should copy file', async () => {
      await supabase.storage.from(testBucket).upload('test.txt', testFile)
      const { error } = await supabase.storage
        .from(testBucket)
        .copy('test.txt', 'copy.txt')

      expect(error).toBeNull()

      // Verify file was copied
      const { data: files } = await supabase.storage.from(testBucket).list()
      expect(files).toContainEqual(expect.objectContaining({ name: 'test.txt' }))
      expect(files).toContainEqual(expect.objectContaining({ name: 'copy.txt' }))
    })

    it('should delete file', async () => {
      await supabase.storage.from(testBucket).upload('test.txt', testFile)
      const { error } = await supabase.storage.from(testBucket).remove(['test.txt'])

      expect(error).toBeNull()

      // Verify file is deleted
      const { data: files } = await supabase.storage.from(testBucket).list()
      expect(files).not.toContainEqual(expect.objectContaining({ name: 'test.txt' }))
    })
  })

  describe('Storage Policies', () => {
    let secondUser: ReturnType<typeof generateTestUser>

    beforeEach(async () => {
      await supabase.storage.createBucket(testBucket, { public: false })
      await supabase.storage.from(testBucket).upload('test.txt', testFile)

      // Create second user
      secondUser = generateTestUser()
      await supabase.auth.signUp({
        email: secondUser.email,
        password: secondUser.password,
      })
    })

    it('should enforce bucket privacy', async () => {
      // Sign in as second user
      await supabase.auth.signInWithPassword({
        email: secondUser.email,
        password: secondUser.password,
      })

      const { error } = await supabase.storage
        .from(testBucket)
        .download('test.txt')

      expect(error).toBeTruthy()
    })

    it('should allow public access to public buckets', async () => {
      // Create public bucket
      const publicBucket = 'public-test-bucket'
      await supabase.storage.createBucket(publicBucket, { public: true })
      await supabase.storage.from(publicBucket).upload('public.txt', testFile)

      // Sign in as second user
      await supabase.auth.signInWithPassword({
        email: secondUser.email,
        password: secondUser.password,
      })

      const { error } = await supabase.storage
        .from(publicBucket)
        .download('public.txt')

      expect(error).toBeNull()
    })

    it('should handle large files', async () => {
      const largeFile = new File([new ArrayBuffer(10 * 1024 * 1024)], 'large.bin')
      const { error } = await supabase.storage
        .from(testBucket)
        .upload('large.bin', largeFile)

      expect(error).toBeNull()
    })

    it('should enforce file type restrictions', async () => {
      const invalidFile = new File(['content'], 'test.exe', { type: 'application/x-msdownload' })
      const { error } = await supabase.storage
        .from(testBucket)
        .upload('test.exe', invalidFile)

      expect(error).toBeTruthy()
    })
  })
}) 