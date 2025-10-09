import { Router } from 'express';
import { requireSuperAdmin, requireAnyTenantOwnerOrSuperAdmin } from '../../middleware/auth.js';
import { wrapAsyncHandler } from '../../utils/response';
import {
  getAllProjectTypes,
  getProjectTypeById,
  createProjectType,
  updateProjectType,
  deleteProjectType
} from './projectTypes.controller';

export function getProjectTypesRouter(): Router {
  const router = Router();

  // Read-only GETs for Tenant Owner or SuperAdmin
  router.get('/', requireAnyTenantOwnerOrSuperAdmin(), wrapAsyncHandler(getAllProjectTypes));
  router.get('/:id', requireAnyTenantOwnerOrSuperAdmin(), wrapAsyncHandler(getProjectTypeById));

  // Management endpoints require SuperAdmin
  router.post('/', requireSuperAdmin(), wrapAsyncHandler(createProjectType));
  router.patch('/:id', requireSuperAdmin(), wrapAsyncHandler(updateProjectType));
  router.delete('/:id', requireSuperAdmin(), wrapAsyncHandler(deleteProjectType));

  return router;
}