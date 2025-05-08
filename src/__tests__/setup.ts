import { beforeEach, afterEach, vi } from 'vitest';
import { resetMocks, mockCollection, mockSuperadminsCollection, mockDb } from './mockDb';
import { AUTH } from './constants';
import './mockAuth';

// Import mock ObjectId
import { ObjectId } from './mockDb';

// Mock MongoDB
vi.mock('mongodb', () => ({
  ObjectId
}));

// Mock database module
vi.mock('../config/db', () => ({
  db: mockDb,
  connectDB: vi.fn().mockResolvedValue(mockDb)
}));

// Mock Auth0 JWKS client
vi.mock('../config/auth0', () => ({
  jwksClient: {
    getSigningKey: vi.fn().mockResolvedValue({
      getPublicKey: () => '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkq...'
    })
  }
}));

// Mock environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  PORT: '3001',
  MONGODB_URI: 'mongodb://localhost:27017/mwap_test',
  AUTH0_DOMAIN: AUTH.DOMAIN,
  AUTH0_AUDIENCE: AUTH.AUDIENCE
};

// Global test setup
beforeEach(() => {
  // Reset all mocks
  resetMocks();
  vi.clearAllMocks();
  
  // Reset dates to a known value
  vi.setSystemTime(new Date('2025-05-08T12:00:00Z'));
});

// Global test cleanup
afterEach(() => {
  // Clear all mocks
  vi.clearAllMocks();
  vi.useRealTimers();
  
  // Reset collections to empty state
  resetMocks();
});