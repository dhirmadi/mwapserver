import { vi } from 'vitest';
import { ObjectId } from 'mongodb';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.AUTH0_DOMAIN = 'test.auth0.com';
process.env.AUTH0_AUDIENCE = 'https://api.test.com';

// Mock logger
vi.mock('../src/utils/logger', () => ({
  logAudit: vi.fn()
}));

// Mock MongoDB
vi.mock('mongodb', () => ({
  ObjectId: vi.fn((id?: string) => ({
    toString: () => id || 'mock-object-id',
    toHexString: () => id || 'mock-object-id'
  }))
}));

// Mock database
vi.mock('../src/config/db', () => {
  const mockCollection = {
    findOne: vi.fn(),
    find: vi.fn(),
    insertOne: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
    findOneAndUpdate: vi.fn()
  };

  const mockCollections: Record<string, any> = {
    tenants: mockCollection,
    superadmins: {
      findOne: vi.fn()
    }
  };

  return {
    db: {
      collection: vi.fn((name: string) => mockCollections[name])
    }
  };
});