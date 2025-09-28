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
  const makeFind = () => ({ toArray: vi.fn() });

  const makeCollection = () => ({
    findOne: vi.fn(),
    find: vi.fn(() => makeFind()),
    insertOne: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
    findOneAndUpdate: vi.fn()
  });

  const mockCollections: Record<string, any> = {
    tenants: makeCollection(),
    superadmins: makeCollection(),
    projects: makeCollection(),
    projectTypes: makeCollection(),
    cloudProviderIntegrations: makeCollection()
  };

  const makeFullCollection = () => ({
    findOne: vi.fn(),
    find: vi.fn(() => ({ toArray: vi.fn() })),
    insertOne: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
    findOneAndUpdate: vi.fn()
  });

  const db = {
    collection: vi.fn((name: string) => mockCollections[name] || makeFullCollection())
  };

  return {
    getDB: () => db,
    db
  };
});

// Ensure mocks also match other specifiers used by tests/services
vi.mock('../../src/config/db', () => {
  const makeFind = () => ({ toArray: vi.fn() });
  const makeCollection = () => ({
    findOne: vi.fn(),
    find: vi.fn(() => makeFind()),
    insertOne: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
    findOneAndUpdate: vi.fn()
  });
  const mockCollections: Record<string, any> = {
    tenants: makeCollection(),
    superadmins: makeCollection(),
    projects: makeCollection(),
    projectTypes: makeCollection(),
    cloudProviderIntegrations: makeCollection()
  };
  const makeFullCollection = () => ({
    findOne: vi.fn(),
    find: vi.fn(() => ({ toArray: vi.fn() })),
    insertOne: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
    findOneAndUpdate: vi.fn()
  });
  const db = {
    collection: vi.fn((name: string) => mockCollections[name] || makeFullCollection())
  };
  return { getDB: () => db, db };
});

vi.mock('../../src/config/db.js', () => {
  const makeFind = () => ({ toArray: vi.fn() });
  const makeCollection = () => ({
    findOne: vi.fn(),
    find: vi.fn(() => makeFind()),
    insertOne: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
    findOneAndUpdate: vi.fn()
  });
  const mockCollections: Record<string, any> = {
    tenants: makeCollection(),
    superadmins: makeCollection(),
    projects: makeCollection(),
    projectTypes: makeCollection(),
    cloudProviderIntegrations: makeCollection()
  };
  const makeFullCollection = () => ({
    findOne: vi.fn(),
    find: vi.fn(() => ({ toArray: vi.fn() })),
    insertOne: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
    findOneAndUpdate: vi.fn()
  });
  const db = {
    collection: vi.fn((name: string) => mockCollections[name] || makeFullCollection())
  };
  return { getDB: () => db, db };
});

// Mock public routes module to satisfy middleware tests resolution
vi.mock('../src/middleware/publicRoutes.js', () => ({
  isPublicRoute: vi.fn(() => null),
  logPublicRouteAccess: vi.fn(),
  PUBLIC_ROUTES: []
}), { virtual: true });

// Also mock using the specifier as used by tests in subfolders
vi.mock('../../src/middleware/publicRoutes.js', () => ({
  isPublicRoute: vi.fn(() => null),
  logPublicRouteAccess: vi.fn(),
  PUBLIC_ROUTES: []
}), { virtual: true });

vi.mock('../../src/middleware/publicRoutes', () => ({
  isPublicRoute: vi.fn(() => null),
  logPublicRouteAccess: vi.fn(),
  PUBLIC_ROUTES: []
}), { virtual: true });

// Mock cloud integration/provider services for OAuth tests resolution
vi.mock('../src/features/cloud-integrations/cloudIntegrations.service.js', () => ({
  CloudIntegrationsService: class {
    async getIntegrationById() { return null; }
  }
}), { virtual: true });

vi.mock('../../src/features/cloud-integrations/cloudIntegrations.service.js', () => ({
  CloudIntegrationsService: class {
    async getIntegrationById() { return null; }
  }
}), { virtual: true });

vi.mock('../src/features/cloud-providers/cloudProviders.service.js', () => ({
  CloudProviderService: class {
    async findById() { return null; }
  }
}), { virtual: true });

vi.mock('../../src/features/cloud-providers/cloudProviders.service.js', () => ({
  CloudProviderService: class {
    async findById() { return null; }
  }
}), { virtual: true });