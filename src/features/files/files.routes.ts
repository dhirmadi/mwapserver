import { Router } from 'express';
import { wrapAsyncHandler } from '../../utils/response.js';
import { authenticateJWT } from '../../middleware/auth.js';
import { requireProjectRole } from '../../middleware/roles.js';
import { listProjectFiles } from './files.controller.js';

export function getFilesRouter(): Router {
  const router = Router({ mergeParams: true }); // mergeParams to access parent router params
  
  // Apply JWT authentication to all routes
  router.use(authenticateJWT());
  
  // GET /api/v1/projects/:id/files
  router.get('/', requireProjectRole('MEMBER'), wrapAsyncHandler(listProjectFiles));
  
  return router;
}