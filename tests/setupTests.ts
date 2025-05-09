import { vi } from 'vitest';
import { ObjectId } from 'mongodb';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.AUTH0_DOMAIN = 'test.auth0.com';
process.env.AUTH0_AUDIENCE = 'https://api.test.com';

// Mock MongoDB ObjectId
vi.mock('mongodb', () => {
  return {
    ObjectId: vi.fn((id?: string) => ({
      toString: () => id || 'mock-object-id',
      toHexString: () => id || 'mock-object-id'
    })),
    MongoClient: vi.fn(() => ({
      connect: vi.fn(),
      db: vi.fn(() => ({
        collection: vi.fn(() => ({
          findOne: vi.fn(),
          find: vi.fn(),
          insertOne: vi.fn(),
          updateOne: vi.fn(),
          deleteOne: vi.fn()
        }))
      }))
    }))
  };
});