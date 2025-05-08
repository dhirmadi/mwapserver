import { ObjectId } from 'mongodb';
import { vi } from 'vitest';

/**
 * MongoDB operation results with proper typing
 */
export interface MongoOperationResults<T> {
  findOne: T | null;
  find: { toArray: () => Promise<T[]> };
  findOneAndUpdate: { value: T | null };
  insertOne: { insertedId: ObjectId };
  deleteOne: { deletedCount: number };
  updateOne: { modifiedCount: number };
  deleteMany: { deletedCount: number };
}

/**
 * Mock collection type with proper method typing
 */
export type MockCollection<T> = {
  [K in keyof MongoOperationResults<T>]: vi.Mock<any, Promise<MongoOperationResults<T>[K]>>;
};

/**
 * Create a typed mock collection with default implementations
 */
export function createMockCollection<T>(): MockCollection<T> {
  return {
    findOne: vi.fn().mockResolvedValue(null),
    find: vi.fn().mockReturnValue({ toArray: () => Promise.resolve([]) }),
    findOneAndUpdate: vi.fn().mockResolvedValue({ value: null }),
    insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
    deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteMany: vi.fn().mockResolvedValue({ deletedCount: 0 })
  };
}

/**
 * Type-safe reset function for mock collections
 */
export function resetCollection<T>(collection: MockCollection<T>) {
  collection.findOne.mockResolvedValue(null);
  collection.find.mockReturnValue({ toArray: () => Promise.resolve([]) });
  collection.findOneAndUpdate.mockResolvedValue({ value: null });
  collection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });
  collection.deleteOne.mockResolvedValue({ deletedCount: 1 });
  collection.updateOne.mockResolvedValue({ modifiedCount: 1 });
  collection.deleteMany.mockResolvedValue({ deletedCount: 0 });
}