/**
 * Module: middleware/validateRequest.ts
 * Responsibility: Provide reusable Zod-based request validation middleware
 * Inputs: Zod schema and optional source selector ('body' | 'query' | 'params')
 * Outputs: NextFunction or ApiResponse error via global handler
 * Security: Auth0 JWT | respects existing auth on routes using it
 * Notes: Uses utils/validate.validateWithSchema for consistent error shapes
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateWithSchema } from '../utils/validate.js';

export function validateRequest<T>(schema: z.Schema<T>, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Validate selected source and assign parsed result back to req
      const input = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const parsed = validateWithSchema(schema, input);
      if (source === 'body') {
        req.body = parsed as unknown as Request['body'];
      } else if (source === 'query') {
        req.query = parsed as unknown as Request['query'];
      } else {
        req.params = parsed as unknown as Request['params'];
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}


