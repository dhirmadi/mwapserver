import { Application } from 'express';
import type { Response } from 'supertest';
import type { SuperTest, Test } from 'supertest';
import supertest from 'supertest';
import { ObjectId } from 'mongodb';
import { AUTH } from './constants';

/**
 * Create an authenticated request
 */
export function authRequest(app: Application): SuperTest<Test> {
  return supertest(app);
}

/**
 * Create an admin request
 */
export function adminRequest(app: Application): SuperTest<Test> {
  return supertest(app);
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