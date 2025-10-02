import { Response } from 'express';
import { ApiError } from './errors.js';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function jsonResponse<T>(res: Response, status: number, data?: T): Response {
  const payload: any = { success: status >= 200 && status < 400 };
  if (payload.success) {
    payload.data = data;
  } else if (data) {
    payload.error = data;
  }
  return res.status(status).json(payload);
}

export function errorResponse(res: Response, error: Error): void {
  const status = error instanceof ApiError ? error.status : 500;
  const code = error instanceof ApiError ? error.code : 'server/internal-error';
  const details = error instanceof ApiError ? (error as any).details : undefined;

  res.status(status).json({
    success: false,
    error: {
      code,
      message: error.message,
      ...(details && { details })
    }
  });
}

export function wrapAsyncHandler(fn: Function) {
  return async function(req: any, res: Response, next: Function) {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}