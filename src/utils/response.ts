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
  return res.status(status).json({
    success: true,
    data
  });
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
      // Check if response has already been sent
      if (res.headersSent) {
        console.log('DEBUG: Headers already sent, skipping handler execution');
        return;
      }
      
      // Add a flag to the request to track if this handler has been executed
      const handlerKey = `__executed_${fn.name || 'anonymous'}`;
      if ((req as any)[handlerKey]) {
        console.log(`DEBUG: Handler ${fn.name || 'anonymous'} already executed for this request, skipping`);
        return next();
      }
      
      (req as any)[handlerKey] = true;
      console.log(`DEBUG: Executing handler ${fn.name || 'anonymous'}`);
      
      const result = await fn(req, res, next);
      
      // If the function returns a value but hasn't sent a response, send it
      if (result !== undefined && !res.headersSent) {
        return result;
      }
    } catch (error) {
      if (!res.headersSent) {
        next(error);
      } else {
        console.error('DEBUG: Error occurred but headers already sent:', error);
      }
    }
  };
}