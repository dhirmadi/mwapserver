import { Router } from 'express';
import { getUserRoles } from './user.controller.js';
import { wrapAsyncHandler } from '../../utils/response.js';

export function getUserRouter(): Router {
  const router = Router();

  // Get current user's roles
  router.get('/me/roles', wrapAsyncHandler(getUserRoles));

  return router;
}