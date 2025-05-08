import { Application } from 'express';
import supertest from 'supertest';
import type { Response } from 'supertest';
import { ObjectId } from 'mongodb';
import { AUTH } from './constants';

/**
 * Create an authenticated request
 */
export function authRequest(app: Application) {
  return supertest(app).set('Authorization', AUTH.HEADER);
}

/**
 * Create an admin request
 */
export function adminRequest(app: Application) {
  return supertest(app).set('Authorization', `Bearer ${AUTH.ADMIN.sub}`);
}

/**
 * Verify error response format
 */
export function expectError(response: Response, status: number, code: string) {
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
export function expectSuccess(response: Response, status = 200) {
  expect(response.status).toBe(status);
  expect(response.body.success).not.toBe(false);
}

/**
 * Convert string to ObjectId safely
 */
export function toObjectId(id: string | ObjectId): ObjectId {
  return typeof id === 'string' ? new ObjectId(id) : id;
}