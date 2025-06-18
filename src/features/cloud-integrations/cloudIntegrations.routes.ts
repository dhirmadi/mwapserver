import { Router } from 'express';
import { wrapAsyncHandler } from '../../utils/response.js';
import { requireTenantOwner } from '../../middleware/authorization.js';
import {
  getTenantIntegrations,
  getTenantIntegrationById,
  createTenantIntegration,
  updateTenantIntegration,
  deleteTenantIntegration,
  handleOAuthCallback
} from './cloudIntegrations.controller.js';

export function getCloudIntegrationsRouter(): Router {
  const router = Router({ mergeParams: true });
  
  // All routes require tenant owner authorization
  router.use(requireTenantOwner);
  
  // GET /api/v1/tenants/:tenantId/cloud-integrations
  router.get('/', wrapAsyncHandler(getTenantIntegrations));
  
  // GET /api/v1/tenants/:tenantId/cloud-integrations/:integrationId
  router.get('/:integrationId', wrapAsyncHandler(getTenantIntegrationById));
  
  // POST /api/v1/tenants/:tenantId/cloud-integrations
  router.post('/', wrapAsyncHandler(createTenantIntegration));
  
  // PATCH /api/v1/tenants/:tenantId/cloud-integrations/:integrationId
  router.patch('/:integrationId', wrapAsyncHandler(updateTenantIntegration));
  
  // DELETE /api/v1/tenants/:tenantId/cloud-integrations/:integrationId
  router.delete('/:integrationId', wrapAsyncHandler(deleteTenantIntegration));
  
  // GET /api/v1/tenants/:tenantId/cloud-integrations/:integrationId/oauth/callback
  router.get('/:integrationId/oauth/callback', wrapAsyncHandler(handleOAuthCallback));
  
  return router;
}