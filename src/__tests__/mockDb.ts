import { vi } from 'vitest';
import { ObjectId } from 'mongodb';

// Create mock collections
const createMockCollection = () => ({
  findOne: vi.fn(),
  find: vi.fn(),
  insertOne: vi.fn(),
  updateOne: vi.fn(),
  findOneAndUpdate: vi.fn(),
  deleteOne: vi.fn(),
  deleteMany: vi.fn()
});

export const mockCollection = createMockCollection();
export const mockSuperadminsCollection = createMockCollection();

// Create a shared mock db that can be used across tests
export const mockDb = {
  collection: vi.fn((name: string) => {
    if (name === 'superadmins') {
      return mockSuperadminsCollection;
    }
    return mockCollection;
  })
};

// Reset all mocks and set default behaviors
export function resetMocks() {
  vi.clearAllMocks();
  
  // Default behaviors for main collection
  mockCollection.findOne.mockResolvedValue(null);
  mockCollection.find.mockReturnValue({ toArray: () => Promise.resolve([]) });
  mockCollection.insertOne.mockImplementation(async (doc) => {
    const _id = doc._id || new ObjectId();
    const tenant = {
      ...doc,
      _id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockCollection.findOne.mockResolvedValueOnce(tenant);
    return { insertedId: _id };
  });
  mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
  mockCollection.findOneAndUpdate.mockImplementation(async (query, update, options) => {
    const doc = await mockCollection.findOne(query);
    if (!doc) return { value: null };
    const updatedDoc = {
      ...doc,
      ...update.$set,
      updatedAt: new Date()
    };
    return { value: updatedDoc };
  });
  mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
  mockCollection.deleteMany.mockResolvedValue({ deletedCount: 0 });

  // Default behaviors for superadmins collection
  mockSuperadminsCollection.findOne.mockResolvedValue(null);
  mockSuperadminsCollection.find.mockReturnValue({ toArray: () => Promise.resolve([]) });
  mockSuperadminsCollection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });
  mockSuperadminsCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
  mockSuperadminsCollection.findOneAndUpdate.mockResolvedValue({ value: null });
  mockSuperadminsCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
  mockSuperadminsCollection.deleteMany.mockResolvedValue({ deletedCount: 0 });
}

// Mock the db module
vi.mock('../config/db', () => ({
  db: mockDb
}));