import { Router } from 'express';
import { requireSuperAdminRole } from '../../middleware/authorization.js';
import { wrapAsyncHandler } from '../../utils/response.js';
import {
  getAllCloudProviders,
  getCloudProviderById,
  createCloudProvider,
  updateCloudProvider,
  deleteCloudProvider
} from './cloudProviders.controller.js';
import { logInfo } from '../../utils/logger.js';

export function getCloudProviderRouter(): Router {
  const router = Router();

  // Public GET endpoints - accessible to all authenticated users (including tenant owners)
  logInfo('Cloud providers GET endpoints initialized with standard JWT authentication');
  
  // GET /api/v1/cloud-providers
  router.get('/', wrapAsyncHandler(getAllCloudProviders));

  // GET /api/v1/cloud-providers/:id
  router.get('/:id', wrapAsyncHandler(getCloudProviderById));
  
  // All other routes require SUPERADMIN role
  router.use(requireSuperAdminRole());
  
  logInfo('Cloud providers modification endpoints initialized with superadmin authorization');

  // POST /api/v1/cloud-providers
  router.post('/', wrapAsyncHandler(createCloudProvider));

  // PATCH /api/v1/cloud-providers/:id
  router.patch('/:id', wrapAsyncHandler(updateCloudProvider));

  // DELETE /api/v1/cloud-providers/:id
  router.delete('/:id', wrapAsyncHandler(deleteCloudProvider));

  return router;
}