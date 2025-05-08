import { describe, it, expect, beforeEach } from 'vitest';
import app from '../app';
import { AUTH, ERROR_CODES } from './constants';
import { authRequest, expectSuccess, expectError } from './helpers';

// Import test setup
import './setup';

describe('App Setup', () => {
  describe('Health Check', () => {
    it('should return 200 for health check', async () => {
      // Execute
      const response = await authRequest(app).get('/health');

      // Verify
      expectSuccess(response);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('Security Headers', () => {
    it('should set security headers', async () => {
      // Execute
      const response = await authRequest(app).get('/health');

      // Verify
      expect(response.headers).toMatchObject({
        'x-frame-options': 'SAMEORIGIN',
        'x-content-type-options': 'nosniff',
        'x-xss-protection': '0'
      });
    });
  });

  describe('CORS', () => {
    it('should allow CORS in test mode', async () => {
      // Execute
      const response = await authRequest(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');
      
      // Verify
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting headers', async () => {
      // Execute
      const response = await authRequest(app).get('/health');

      // Verify
      expect(response.headers).toMatchObject({
        'x-ratelimit-limit': expect.any(String),
        'x-ratelimit-remaining': expect.any(String)
      });
  });

  describe('Protected Routes', () => {
    it('should require authentication for API routes', async () => {
      // Execute
      const response = await authRequest(app, false).get('/api/v1/tenants/me');

      // Verify
      expectError(response, 401, ERROR_CODES.AUTH.INVALID_TOKEN);
    });

    it('should allow access with valid token', async () => {
      // Execute
      const response = await authRequest(app).get('/api/v1/tenants/me');

      // Verify
      expectSuccess(response);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 routes', async () => {
      // Execute
      const response = await authRequest(app).get('/api/not-found');

      // Verify
      expectError(response, 404, ERROR_CODES.NOT_FOUND);
    });

    it('should handle JSON parsing errors', async () => {
      // Execute
      const response = await authRequest(app)
        .post('/api/v1/tenants')
        .set('Content-Type', 'application/json')
        .send('{"invalid json"');

      // Verify
      expectError(response, 400, ERROR_CODES.VALIDATION_ERROR);
    });

    it('should handle validation errors', async () => {
      // Execute
      const response = await authRequest(app)
        .post('/api/v1/tenants')
        .send({
          name: 'a', // Too short
          settings: {
            maxProjects: 0 // Invalid value
          }
        });

      // Verify
      expectError(response, 400, ERROR_CODES.VALIDATION_ERROR, {
        details: {
          name: 'String must contain at least 2 character(s)',
          settings: {
            maxProjects: 'Number must be greater than or equal to 1'
          }
        }
      });
    });
  });
});