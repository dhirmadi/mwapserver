import { vi } from 'vitest';
import { ObjectId } from 'mongodb';
import { Tenant } from '../schemas/tenant.schema';
import { createMockCollection, MockCollection, resetCollection } from './mockDb.types';

// Define Superadmin type
interface Superadmin {
  _id: ObjectId;
  userId: string;
  createdAt: Date;
}

// Create typed collections
export const mockCollection = createMockCollection<Tenant>();
export const mockSuperadminsCollection = createMockCollection<Superadmin>();

// Create a typed mock db
export const mockDb = {
  collection: vi.fn((name: string): MockCollection<any> => {
    switch (name) {
      case 'superadmins':
        return mockSuperadminsCollection;
      default:
        return mockCollection;
    }
  })
};

// Reset all mocks with proper typing
export function resetMocks() {
  vi.clearAllMocks();

  // Reset tenant collection with smart defaults
  resetCollection(mockCollection);
  mockCollection.findOneAndUpdate.mockImplementation(async (query, update) => {
    const doc = await mockCollection.findOne(query);
    if (!doc) return { value: null };
    const updatedDoc = {
      ...doc,
      ...update.$set,
      updatedAt: new Date()
    };
    return { value: updatedDoc };
  });

  // Reset superadmins collection
  resetCollection(mockSuperadminsCollection);
}

// Mock the db module
vi.mock('../config/db', () => ({
  db: mockDb
}));