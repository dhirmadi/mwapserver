import { Router } from 'express';
import { wrapAsyncHandler } from '../../utils/response.js';
import {
  getTenantIntegrations,
  getTenantIntegrationById,
  createTenantIntegration,
  updateTenantIntegration,
  deleteTenantIntegration
} from './cloudIntegrations.controller.js';
import { requireTenantOwner } from '../../middleware/authorization.js';
import { logInfo } from '../../utils/logger.js';

export function getCloudIntegrationsRouter(): Router {
  const router = Router({ mergeParams: true });
  
  console.log('DEBUG - Cloud integrations router being initialized');
  
  // Add a middleware to log all requests
  router.use((req, res, next) => {
    console.log('DEBUG - Cloud integrations router received request:');
    console.log('DEBUG - Path:', req.path);
    console.log('DEBUG - Original URL:', req.originalUrl);
    console.log('DEBUG - Method:', req.method);
    console.log('DEBUG - Params:', req.params);
    console.log('DEBUG - Body:', JSON.stringify(req.body, null, 2));
    next();
  });
  
  // Apply tenant owner middleware to all routes in this router
  // This ensures only the tenant owner can access these endpoints
  router.use(requireTenantOwner('tenantId'));
  
  logInfo('Cloud integrations router initialized with tenant owner authorization');
  
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