import { vi } from 'vitest';
import { Tenant } from '../schemas/tenant.schema';
import { createMockCollection, MockCollection, resetCollection } from './mockDb.types';
import { AUTH } from './constants';

// Create mock ObjectId
const mockObjectId = (str?: string) => ({
  toString: () => str || 'mock-id',
  toHexString: () => str || 'mock-id',
  equals: (other: any) => other?.toString() === (str || 'mock-id')
});

// Define Superadmin type
interface Superadmin {
  _id: ReturnType<typeof mockObjectId>;
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
  mockCollection.findOne.mockImplementation(async (query: any) => {
    if (query._id) {
      const id = typeof query._id === 'string' ? query._id : query._id.toString();
      return {
        _id: mockObjectId(id),
        name: 'Test Tenant',
        ownerId: AUTH.USER.sub,
        settings: {
          allowPublicProjects: false,
          maxProjects: 10
        },
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    if (query.ownerId === AUTH.USER.sub) {
      return {
        _id: mockObjectId(),
        name: 'Test Tenant',
        ownerId: AUTH.USER.sub,
        settings: {
          allowPublicProjects: false,
          maxProjects: 10
        },
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    return null;
  });

  mockCollection.findOneAndUpdate.mockImplementation(async (query: any, update: any) => {
    const doc = await mockCollection.findOne(query);
    if (!doc) return { value: null };
    return {
      value: {
        ...doc,
        ...update.$set,
        updatedAt: new Date()
      }
    };
  });

  mockCollection.insertOne.mockImplementation(async (doc: any) => {
    const id = mockObjectId();
    const newDoc = {
      _id: id,
      ...doc,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return { insertedId: id };
  });

  mockCollection.find.mockImplementation(() => ({
    toArray: async () => []
  }));

  // Reset superadmins collection
  resetCollection(mockSuperadminsCollection);
  mockSuperadminsCollection.findOne.mockImplementation(async (query: any) => {
    if (query.userId === AUTH.ADMIN.sub) {
      return {
        _id: mockObjectId(),
        userId: AUTH.ADMIN.sub,
        createdAt: new Date()
      };
    }
    return null;
  });
}

// Export mock client for direct use in tests
export const mockMongoClient = {
  connect: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  db: vi.fn().mockReturnValue(mockDb)
};