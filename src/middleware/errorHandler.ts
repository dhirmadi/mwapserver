import { Request, Response, NextFunction } from 'express';
import { logError } from '../utils/logger.js';
import { errorResponse } from '../utils/response.js';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logError('Request error', error);
  errorResponse(res, error);
}