import { Router } from 'express';
import { wrapAsyncHandler } from '../../utils/response.js';
import { authenticateJWT, requireProjectRole } from '../../middleware/auth.js';
import { listProjectFiles } from './files.controller.js';

export function getFilesRouter(): Router {
  const router = Router({ mergeParams: true }); // mergeParams to access parent router params
  
  // JWT authentication is applied globally in app.ts - no need to reapply
  
  // GET /api/v1/projects/:id/files
  router.get('/', requireProjectRole('MEMBER'), wrapAsyncHandler(listProjectFiles));
  
  return router;
}