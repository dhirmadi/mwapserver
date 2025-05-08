import { Application } from 'express';
import request from 'supertest';
import { ObjectId } from 'mongodb';
import { AUTH } from './constants';

/**
 * Create an authenticated request
 */
export function authRequest(app: Application) {
  return request(app).set('Authorization', AUTH.HEADER);
}

/**
 * Create an admin request
 */
export function adminRequest(app: Application) {
  return request(app).set('Authorization', `Bearer ${AUTH.ADMIN.sub}`);
}

/**
 * Verify error response format
 */
export function expectError(response: request.Response, status: number, code: string) {
  expect(response.status).toBe(status);
  expect(response.body).toEqual({
    success: false,
    error: {
      code,
      message: expect.any(String)
    }
  });
}

/**
 * Verify success response format
 */
export function expectSuccess(response: request.Response, status = 200) {
  expect(response.status).toBe(status);
  expect(response.body.success).not.toBe(false);
}

/**
 * Convert string to ObjectId safely
 */
export function toObjectId(id: string | ObjectId): ObjectId {
  return typeof id === 'string' ? new ObjectId(id) : id;
}