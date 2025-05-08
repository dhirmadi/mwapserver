import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { AUTH, ERROR_CODES } from './constants';

describe('App Setup', () => {
  describe('Health Check', () => {
    it('should return 200 for health check', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('Security Headers', () => {
    it('should set security headers', async () => {
      const response = await request(app).get('/health');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBe('0');
    });
  });

  describe('CORS', () => {
    it('should allow CORS in test mode', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting headers', async () => {
      const response = await request(app).get('/health');
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });

  describe('Protected Routes', () => {
    it('should require authentication for API routes', async () => {
      const response = await request(app).get('/api/v1/tenants/me');
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe(ERROR_CODES.AUTH.INVALID_TOKEN);
    });

    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/tenants/me')
        .set('Authorization', AUTH.HEADER);
      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 routes', async () => {
      const response = await request(app)
        .get('/api/not-found')
        .set('Authorization', AUTH.HEADER);
      expect(response.status).toBe(404);
    });

    it('should handle JSON parsing errors', async () => {
      const response = await request(app)
        .post('/api/v1/tenants')
        .set('Authorization', AUTH.HEADER)
        .set('Content-Type', 'application/json')
        .send('{"invalid json"');
      expect(response.status).toBe(400);
    });
  });
});