import { Router } from 'express';
import { wrapAsyncHandler } from '../../utils/response.js';
import {
  getTenantIntegrations,
  getTenantIntegrationById,
  createTenantIntegration,
  updateTenantIntegration,
  deleteTenantIntegration
} from './cloudIntegrations.controller.js';

export function getCloudIntegrationsRouter(): Router {
  const router = Router({ mergeParams: true });
  
  // GET /api/v1/tenants/:tenantId/integrations
  router.get('/', wrapAsyncHandler(getTenantIntegrations));
  
  // GET /api/v1/tenants/:tenantId/integrations/:integrationId
  router.get('/:integrationId', wrapAsyncHandler(getTenantIntegrationById));
  
  // POST /api/v1/tenants/:tenantId/integrations
  router.post('/', wrapAsyncHandler(createTenantIntegration));
  
  // PATCH /api/v1/tenants/:tenantId/integrations/:integrationId
  router.patch('/:integrationId', wrapAsyncHandler(updateTenantIntegration));
  
  // DELETE /api/v1/tenants/:tenantId/integrations/:integrationId
  router.delete('/:integrationId', wrapAsyncHandler(deleteTenantIntegration));
  
  return router;
}