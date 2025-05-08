import { beforeEach, afterEach } from 'vitest';
import { resetMocks } from './mockDb';
import './mockAuth';

// Mock Auth0 JWKS client
vi.mock('../config/auth0', () => ({
  jwksClient: {
    getSigningKey: vi.fn().mockResolvedValue({
      getPublicKey: () => '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkq...'
    })
  }
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/mwap_test';
process.env.AUTH0_DOMAIN = 'test.auth0.com';
process.env.AUTH0_AUDIENCE = 'https://api.test.mwap.dev';

beforeEach(() => {
  resetMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});