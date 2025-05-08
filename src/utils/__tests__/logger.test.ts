import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logInfo, logError, logAudit } from '../logger.js';

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
      logInfo('Test message');
      
      expect(console.log).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse((console.log as any).mock.calls[0][0]);
      
      expect(loggedData).toEqual({
        level: 'info',
        message: 'Test message',
        timestamp: expect.any(String)
      });
    });

    it('should include metadata when provided', () => {
      const meta = { userId: '123', action: 'test' };
      logInfo('Test with meta', meta);
      
      const loggedData = JSON.parse((console.log as any).mock.calls[0][0]);
      expect(loggedData).toMatchObject({
        level: 'info',
        message: 'Test with meta',
        userId: '123',
        action: 'test'
      });
    });
  });

  describe('logError', () => {
    it('should log error message with timestamp', () => {
      logError('Test error');
      
      expect(console.error).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse((console.error as any).mock.calls[0][0]);
      
      expect(loggedData).toEqual({
        level: 'error',
        message: 'Test error',
        timestamp: expect.any(String)
      });
    });

    it('should include error details when error object provided', () => {
      const error = new Error('Test error');
      logError('Error occurred', error);
      
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
      logAudit('user.create', 'user123', 'resource456');
      
      expect(console.log).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse((console.log as any).mock.calls[0][0]);
      
      expect(loggedData).toEqual({
        level: 'audit',
        action: 'user.create',
        actor: 'user123',
        target: 'resource456',
        timestamp: expect.any(String)
      });
    });

    it('should include metadata in audit log', () => {
      const meta = { reason: 'testing', details: { key: 'value' } };
      logAudit('user.delete', 'admin', 'user123', meta);
      
      const loggedData = JSON.parse((console.log as any).mock.calls[0][0]);
      expect(loggedData).toMatchObject({
        level: 'audit',
        action: 'user.delete',
        actor: 'admin',
        target: 'user123',
        reason: 'testing',
        details: { key: 'value' }
      });
    });
  });
});