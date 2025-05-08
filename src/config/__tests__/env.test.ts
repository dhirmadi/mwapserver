import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { envSchema } from '../env.js';
import { AUTH } from '../../__tests__/constants';

// Import test setup
import '../../__tests__/setup';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules and environment
    vi.resetModules();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      PORT: '3001',
      MONGODB_URI: 'mongodb://localhost:27017/mwap_test',
      AUTH0_DOMAIN: AUTH.DOMAIN,
      AUTH0_AUDIENCE: AUTH.AUDIENCE
    };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('envSchema', () => {
    it('should validate correct environment variables', () => {
      // Execute
      const result = envSchema.parse(process.env);

      // Verify
      expect(result).toEqual({
        NODE_ENV: 'test',
        PORT: 3001,
        MONGODB_URI: 'mongodb://localhost:27017/mwap_test',
        AUTH0_DOMAIN: AUTH.DOMAIN,
        AUTH0_AUDIENCE: AUTH.AUDIENCE
      });
    });

    it('should use default values when NODE_ENV and PORT are not provided', () => {
      // Setup
      delete process.env.NODE_ENV;
      delete process.env.PORT;
      
      // Execute
      const result = envSchema.parse(process.env);

      // Verify
      expect(result).toMatchObject({
        NODE_ENV: 'development',
        PORT: 3001
      });
    });

    it('should throw error for invalid MONGODB_URI', () => {
      // Setup
      process.env.MONGODB_URI = 'invalid-uri';

      // Execute and verify
      expect(() => envSchema.parse(process.env))
        .toThrow('Invalid MongoDB URI format');
    });

    it('should throw error for invalid AUTH0_AUDIENCE', () => {
      // Setup
      process.env.AUTH0_AUDIENCE = 'invalid-url';

      // Execute and verify
      expect(() => envSchema.parse(process.env))
        .toThrow('Invalid Auth0 audience URL');
    });

    it('should throw error for missing required variables', () => {
      // Setup
      delete process.env.MONGODB_URI;

      // Execute and verify
      expect(() => envSchema.parse(process.env))
        .toThrow('Required');
    });

    it('should validate PORT within valid range', () => {
      // Test invalid values
      process.env.PORT = '0';
      expect(() => envSchema.parse(process.env))
        .toThrow('Number must be greater than or equal to 1');
      
      process.env.PORT = '65536';
      expect(() => envSchema.parse(process.env))
        .toThrow('Number must be less than or equal to 65535');
      
      // Test valid value
      process.env.PORT = '3000';
      expect(() => envSchema.parse(process.env)).not.toThrow();
    });

    it('should validate NODE_ENV enum values', () => {
      // Test invalid value
      process.env.NODE_ENV = 'invalid';
      expect(() => envSchema.parse(process.env))
        .toThrow('Invalid enum value');

      // Test valid values
      const validEnvs = ['development', 'production', 'test'];
      validEnvs.forEach(env => {
        process.env.NODE_ENV = env;
        expect(() => envSchema.parse(process.env)).not.toThrow();
      });
    });
  });
});