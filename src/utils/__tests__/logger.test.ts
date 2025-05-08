import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logInfo, logError, logAudit } from '../logger.js';
import { AUTH } from '../../__tests__/constants';

// Import test setup
import '../../__tests__/setup';

describe('logger utils', () => {
  beforeEach(() => {
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logInfo', () => {
    it('should log info message with timestamp', () => {
      // Execute
      logInfo('Test message');
      
      // Verify
      expect(console.log).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse((console.log as any).mock.calls[0][0]);
      
      expect(loggedData).toEqual({
        level: 'info',
        message: 'Test message',
        timestamp: expect.any(String)
      });
    });

    it('should include metadata when provided', () => {
      // Create test data
      const meta = { 
        userId: AUTH.USER.sub, 
        action: 'test' 
      };

      // Execute
      logInfo('Test with meta', meta);
      
      // Verify
      const loggedData = JSON.parse((console.log as any).mock.calls[0][0]);
      expect(loggedData).toMatchObject({
        level: 'info',
        message: 'Test with meta',
        userId: AUTH.USER.sub,
        action: 'test'
      });
    });
  });

  describe('logError', () => {
    it('should log error message with timestamp', () => {
      // Execute
      logError('Test error');
      
      // Verify
      expect(console.error).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse((console.error as any).mock.calls[0][0]);
      
      expect(loggedData).toEqual({
        level: 'error',
        message: 'Test error',
        timestamp: expect.any(String)
      });
    });

    it('should include error details when error object provided', () => {
      // Create test data
      const error = new Error('Test error');

      // Execute
      logError('Error occurred', error);
      
      // Verify
      const loggedData = JSON.parse((console.error as any).mock.calls[0][0]);
      expect(loggedData).toMatchObject({
        level: 'error',
        message: 'Error occurred',
        error: {
          name: 'Error',
          message: 'Test error',
          stack: expect.any(String)
        }
      });
    });
  });

  describe('logAudit', () => {
    it('should log audit event with required fields', () => {
      // Execute
      logAudit('tenant.create', AUTH.USER.sub, 'tenant123');
      
      // Verify
      expect(console.log).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse((console.log as any).mock.calls[0][0]);
      
      expect(loggedData).toEqual({
        level: 'audit',
        action: 'tenant.create',
        actor: AUTH.USER.sub,
        target: 'tenant123',
        timestamp: expect.any(String)
      });
    });

    it('should include metadata in audit log', () => {
      // Create test data
      const meta = { 
        reason: 'testing', 
        details: { 
          name: 'Test Tenant',
          settings: {
            allowPublicProjects: true,
            maxProjects: 20
          }
        } 
      };

      // Execute
      logAudit('tenant.update', AUTH.ADMIN.sub, 'tenant123', meta);
      
      // Verify
      const loggedData = JSON.parse((console.log as any).mock.calls[0][0]);
      expect(loggedData).toMatchObject({
        level: 'audit',
        action: 'tenant.update',
        actor: AUTH.ADMIN.sub,
        target: 'tenant123',
        reason: 'testing',
        details: {
          name: 'Test Tenant',
          settings: {
            allowPublicProjects: true,
            maxProjects: 20
          }
        }
      });
    });
  });
});