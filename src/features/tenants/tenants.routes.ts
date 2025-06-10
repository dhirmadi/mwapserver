import { Router } from 'express';
import { createTenant, getTenant, updateTenant, deleteTenant } from './tenants.controller.js';
import { wrapAsyncHandler } from '../../utils/response.js';
import { getCloudIntegrationsRouter } from '../cloud-integrations/cloudIntegrations.routes.js';

export function getTenantRouter(): Router {
  const router = Router();

  // JWT authentication is already applied globally in app.ts
  // No need to apply it again here

  // Create tenant
  router.post('/', wrapAsyncHandler(createTenant));

  // Get current user's tenant
  router.get('/me', wrapAsyncHandler(getTenant));

  // Update tenant
  router.patch('/:id', wrapAsyncHandler(updateTenant));

  // Delete tenant (superadmin only)
  router.delete('/:id', wrapAsyncHandler(deleteTenant));

  // Cloud integrations routes
  router.use('/:tenantId/integrations', getCloudIntegrationsRouter());

  return router;
}