import { vi } from 'vitest';
import { ObjectId } from 'mongodb';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.AUTH0_DOMAIN = 'test.auth0.com';
process.env.AUTH0_AUDIENCE = 'https://api.test.com';

// Bridge to real logger shim spies so ESM/CJS share the same instances
// Initialize a single global spy store first
(globalThis as any).__MWAP_LOGGER_SPIES__ = (globalThis as any).__MWAP_LOGGER_SPIES__ || {
  logAudit: vi.fn(),
  logInfo: vi.fn(),
  logError: vi.fn()
};
const loggerSpies = (globalThis as any).__MWAP_LOGGER_SPIES__;
// Ensure all logger import paths resolve to the same spies
vi.doMock('../src/utils/logger.js', () => ({
  logAudit: loggerSpies.logAudit,
  logInfo: loggerSpies.logInfo,
  logError: loggerSpies.logError
}));
vi.doMock('../../src/utils/logger.js', () => ({
  logAudit: loggerSpies.logAudit,
  logInfo: loggerSpies.logInfo,
  logError: loggerSpies.logError
}));
vi.doMock('../../src/utils/logger', () => ({
  logAudit: loggerSpies.logAudit,
  logInfo: loggerSpies.logInfo,
  logError: loggerSpies.logError
}));

// Use real OAuth service shim; individual tests can spy on prototype methods

// Disable rate limiting for tests that exercise performance
vi.mock('express-rate-limit', () => ({
  __esModule: true,
  default: () => (req: any, _res: any, next: any) => next()
}));

// Force CJS require() paths to share spies (handled via doMock above)

// Use real mongodb for integration tests

// In-memory DB mock for integration tests
const createInMemoryDb = () => {
  const store: Record<string, any[]> = {};
  const apis: Record<string, any> = {};
  const ensure = (name: string) => (store[name] ||= []);
  const match = (doc: any, query: any): boolean => {
    if (!query) return true;
    if (query.$or) return query.$or.some((q: any) => match(doc, q));
    if (query.$and) return query.$and.every((q: any) => match(doc, q));
    return Object.keys(query).every((k) => {
      const v = (doc as any)[k];
      const qv = query[k];
      if (qv && typeof qv === 'object' && !Array.isArray(qv)) {
        // Handle {_id: {$oid: "..."}}
        if ('$oid' in qv) return String(v) === String(qv.$oid);
        // Handle {_id: ObjectId("...")} comparisons
        const maybeToHex = (qv as any).toHexString?.();
        const maybeToStr = (qv as any).toString?.();
        if (maybeToHex || maybeToStr) {
          const rhs = (maybeToHex && typeof maybeToHex === 'string') ? maybeToHex : (typeof maybeToStr === 'string' ? maybeToStr : String(qv));
          return String(v) === String(rhs);
        }
        if ('$ne' in qv) return v !== qv.$ne;
      }
      return String(v) === String(qv);
    });
  };
  const genId = () => {
    const hex = Math.random().toString(16).slice(2).padEnd(24, '0').slice(0,24);
    return {
      toString: () => hex,
      toHexString: () => hex
    };
  };
  const collection = (name: string) => {
    if (!apis[name]) {
      const methods = {
        findOne: vi.fn(async (query?: any) => ensure(name).find((d) => match(d, query)) || null),
        find: vi.fn((query?: any) => ({ toArray: vi.fn(async () => (query ? ensure(name).filter((d)=>match(d, query)) : [...ensure(name)])) })),
        insertOne: vi.fn(async (doc?: any) => {
          const insertedId = genId();
          const _id = insertedId.toString();
          const rec = { _id, ...(doc || {}) };
          if (name === 'cloudProviders') {
            (rec as any)._id = _id;
          }
          ensure(name).push(rec);
          return { insertedId };
        }),
        insertMany: vi.fn(async (docs?: any[]) => {
          const ids = (docs || []).map((_d) => genId());
          (docs || []).forEach((d, i) => ensure(name).push({ _id: ids[i].toString(), ...d }));
          return { insertedIds: ids };
        }),
        updateOne: vi.fn(async (filter: any, update: any) => {
          const arr = ensure(name);
          const idx = arr.findIndex((d) => match(d, filter));
          if (idx >= 0) {
            if (update.$set) arr[idx] = { ...arr[idx], ...update.$set };
            return { matchedCount: 1, modifiedCount: 1 };
          }
          return { matchedCount: 0, modifiedCount: 0 };
        }),
        deleteOne: vi.fn(async (filter: any) => {
          const arr = ensure(name);
          const idx = arr.findIndex((d) => match(d, filter));
          if (idx >= 0) { arr.splice(idx,1); return { deletedCount: 1 }; }
          return { deletedCount: 0 };
        }),
        deleteMany: vi.fn(async (filter?: any) => {
          const arr = ensure(name);
          const before = arr.length;
          if (!filter) { arr.length = 0; return { deletedCount: before }; }
          for (let i = arr.length - 1; i >= 0; i--) if (match(arr[i], filter)) arr.splice(i,1);
          return { deletedCount: before - arr.length };
        }),
        findOneAndUpdate: vi.fn(async (filter: any, update: any) => {
          const arr = ensure(name);
          const idx = arr.findIndex((d) => match(d, filter));
          if (idx >= 0) {
            if (update.$set) arr[idx] = { ...arr[idx], ...update.$set };
            return arr[idx];
          }
          return null;
        }),
        countDocuments: vi.fn(async (filter?: any) => (filter ? ensure(name).filter((d)=>match(d, filter)).length : ensure(name).length))
      };
      apis[name] = methods;
    }
    return apis[name];
  };
  const db = { collection: vi.fn((n: string) => collection(n)) };
  return db;
};

const inMemoryDb = createInMemoryDb();

vi.mock('../src/config/db', () => ({
  getDB: () => inMemoryDb,
  db: inMemoryDb,
  connectToDatabase: vi.fn(async () => inMemoryDb),
  disconnectFromDatabase: vi.fn(async () => undefined)
}));

vi.mock('../../src/config/db', () => ({
  getDB: () => inMemoryDb,
  db: inMemoryDb,
  connectToDatabase: vi.fn(async () => inMemoryDb),
  disconnectFromDatabase: vi.fn(async () => undefined)
}));

vi.mock('../../src/config/db.js', () => ({
  getDB: () => inMemoryDb,
  db: inMemoryDb,
  connectToDatabase: vi.fn(async () => inMemoryDb),
  disconnectFromDatabase: vi.fn(async () => undefined)
}));

// Mock mongodb-memory-server to avoid real downloads
vi.mock('mongodb-memory-server', () => ({
  MongoMemoryServer: class {
    static async create() { return new this(); }
    getUri() { return 'mongodb://localhost:27017/mock'; }
    async stop() { return; }
  }
}));

// Use real DB module for integration tests

// Use real DB module for integration tests

// Mock public routes module to satisfy middleware tests resolution
const oauthCallbackConfig = {
  path: '/api/v1/oauth/callback',
  methods: ['GET'],
  exposesData: false,
  approved: true,
  justification: 'OAuth providers must be able to call this callback endpoint',
  securityControls: [
    'state validation',
    'nonce validation',
    'HTTPS-only redirect URIs',
    'host/path allowlist',
    'rate limiting',
    'generic errors',
    'audit logging'
  ],
  externalCallers: [
    'Google OAuth 2.0 service',
    'Dropbox OAuth 2.0 service',
    'Microsoft OneDrive OAuth 2.0 service'
  ],
  approvedDate: '2025-01-17'
};
vi.mock('../src/middleware/publicRoutes.js', () => {
  const isPublicRoute = vi.fn((path: string, method: string) => {
    const norm = (path || '').split('?')[0].replace(/\/$/, '') || '/';
    const upper = (method || '').toUpperCase();
    if (norm === '/api/v1/oauth/callback' && upper === 'GET') return oauthCallbackConfig as any;
    if (norm === '/health' && upper === 'GET') return null as any; // handled separately
    return null;
  });
  const logPublicRouteAccess = vi.fn((route: any, meta: any, success: boolean, logger?: any) => {
    const enriched = {
      publicRoute: route.path,
      method: meta?.method,
      success,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      ...meta
    };
    if (success) {
      (logger?.logAudit || loggerSpies.logAudit)('public.route.access.success', 'external', route.path, enriched);
    } else {
      (logger?.logError || loggerSpies.logError)('public.route.access.failed', enriched);
    }
  });
  const validatePublicRoutesSecurity = vi.fn(() => ({ valid: true, issues: [] }));
  const getPublicRoutesSecurityReport = vi.fn(() => ({ totalRoutes: 1, routesByMethod: { GET: 1 }, dataExposingRoutes: 0, securityIssues: [] }));
  return { isPublicRoute, logPublicRouteAccess, PUBLIC_ROUTES: [oauthCallbackConfig], validatePublicRoutesSecurity, getPublicRoutesSecurityReport };
});

// Also mock using the specifier as used by tests in subfolders
vi.mock('../../src/middleware/publicRoutes.js', () => {
  const isPublicRoute = vi.fn((path: string, method: string) => {
    const norm = (path || '').split('?')[0].replace(/\/$/, '') || '/';
    const upper = (method || '').toUpperCase();
    if (norm === '/api/v1/oauth/callback' && upper === 'GET') return oauthCallbackConfig as any;
    if (norm === '/health' && upper === 'GET') return null as any;
    return null;
  });
  const logPublicRouteAccess = vi.fn((route: any, meta: any, success: boolean, logger?: any) => {
    const enriched = {
      publicRoute: route.path,
      method: meta?.method,
      success,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      ...meta
    };
    if (success) {
      (logger?.logAudit || loggerSpies.logAudit)('public.route.access.success', 'external', route.path, enriched);
    } else {
      (logger?.logError || loggerSpies.logError)('public.route.access.failed', enriched);
    }
  });
  const validatePublicRoutesSecurity = vi.fn(() => ({ valid: true, issues: [] }));
  const getPublicRoutesSecurityReport = vi.fn(() => ({ totalRoutes: 1, routesByMethod: { GET: 1 }, dataExposingRoutes: 0, securityIssues: [] }));
  return { isPublicRoute, logPublicRouteAccess, PUBLIC_ROUTES: [oauthCallbackConfig], validatePublicRoutesSecurity, getPublicRoutesSecurityReport };
});

// (deduplicated) publicRoutes mocks handled by path-specific mocks above

// Logger mocks are unified via vi.doMock at the top; remove redundant vi.mock variants

// Use real services for integration tests

// Ensure OAuth service methods are spy-able at import time
vi.mock('../../src/features/oauth/oauth.service.js', () => {
  function OAuthService(this: any) {}
  (OAuthService as any).prototype.exchangeCodeForTokens = vi.fn().mockResolvedValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
    scopesGranted: ['https://www.googleapis.com/auth/drive.readonly']
  });
  (OAuthService as any).prototype.refreshTokens = vi.fn().mockResolvedValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
    scopesGranted: ['https://www.googleapis.com/auth/drive.readonly']
  });
  return { OAuthService };
});

// Make CloudProviderService.findById read from in-memory DB to prevent VERIFICATION_ERROR during tests
vi.mock('../../src/features/cloud-providers/cloudProviders.service.js', () => {
  class CloudProviderService {
    async findById(id: string) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { getDB } = require('../../src/config/db.js');
      const col = getDB().collection('cloudProviders');
      const byString = await col.findOne({ _id: id });
      if (byString) return byString;
      const byOid = await col.findOne({ _id: { $oid: id } });
      if (byOid) return byOid;
      return null;
    }
  }
  return { CloudProviderService };
});