// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { loadEnvConfig } from '@next/env'

// Load environment variables from .env.test
loadEnvConfig(process.cwd(), true)

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Increase timeout for all tests
jest.setTimeout(30000)

// Mock fetch for tests
global.fetch = jest.fn()

// Mock WebSocket for tests
class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = 1
    setTimeout(() => {
      if (this.onopen) this.onopen()
    }, 0)
  }

  send() {}
  close() {}
}

global.WebSocket = MockWebSocket

// Mock localStorage
class LocalStorageMock {
  constructor() {
    this.store = {}
  }

  clear() {
    this.store = {}
  }

  getItem(key) {
    return this.store[key] || null
  }

  setItem(key, value) {
    this.store[key] = String(value)
  }

  removeItem(key) {
    delete this.store[key]
  }
}

global.localStorage = new LocalStorageMock()

// Mock window.location
delete window.location
window.location = {
  protocol: 'http:',
  host: 'localhost',
  assign: jest.fn(),
  reload: jest.fn(),
  replace: jest.fn(),
  toString: jest.fn(),
}

// Suppress console errors during tests
const originalError = console.error
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Not implemented: navigation') ||
      args[0].includes('ENOTFOUND') ||
      args[0].includes('Invalid status code'))
  ) {
    return
  }
  originalError.call(console, ...args)
}

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  useSearchParams() {
    return {
      get: jest.fn(),
    }
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://your-project.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'your-anon-key' 