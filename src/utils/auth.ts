import { Request } from 'express';
import { AuthError } from './errors.js';

export interface User {
  sub: string;
  email: string;
  name: string;
}

// Extend Express Request type to include auth property
declare global {
  namespace Express {
    interface Request {
      auth?: User;
    }
  }
}

export function getUserFromToken(req: Request): User {
  const user = req.auth;
  if (!user || !user.sub) {
    throw new AuthError('Invalid user token');
  }
  return user;
}