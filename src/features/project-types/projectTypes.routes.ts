import { Router } from 'express';
import { Collection } from 'mongodb';
import { ProjectTypesController } from './projectTypes.controller';
import { ProjectTypesService } from './projectTypes.service';
import { authenticateJWT } from '../../middleware/auth';
import { requireSuperAdmin } from '../../middleware/roles';
import { wrapAsyncHandler } from '../../utils/response';

export function createProjectTypesRouter(projectTypesCollection: Collection): Router {
  const router = Router();
  const projectTypesService = new ProjectTypesService(projectTypesCollection);
  const projectTypesController = new ProjectTypesController(projectTypesService);

  // All routes require authentication and SUPERADMIN role
  router.use(authenticateJWT());
  router.use(requireSuperAdmin());

  // GET /api/v1/project-types
  router.get('/', wrapAsyncHandler(projectTypesController.getAll));

  // GET /api/v1/project-types/:id
  router.get('/:id', wrapAsyncHandler(projectTypesController.getById));

  // POST /api/v1/project-types
  router.post('/', wrapAsyncHandler(projectTypesController.create));

  // PATCH /api/v1/project-types/:id
  router.patch('/:id', wrapAsyncHandler(projectTypesController.update));

  // DELETE /api/v1/project-types/:id
  router.delete('/:id', wrapAsyncHandler(projectTypesController.delete));

  return router;
}