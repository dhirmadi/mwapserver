import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { wrapAsyncHandler } from '../../utils/response.js';
import {
  getTenantIntegrations,
  getTenantIntegrationById,
  createTenantIntegration,
  updateTenantIntegration,
  deleteTenantIntegration,
  refreshIntegrationToken,
  checkIntegrationHealth,
  testIntegrationConnectivity
} from './cloudIntegrations.controller.js';
import { requireTenantOwner } from '../../middleware/auth.js';
import { logInfo } from '../../utils/logger.js';

export function getCloudIntegrationsRouter(): Router {
  const router = Router({ mergeParams: true });
  
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
  
  // POST /api/v1/tenants/:tenantId/integrations/:integrationId/refresh-token
  router.post('/:integrationId/refresh-token', wrapAsyncHandler(refreshIntegrationToken));
  
  // POST /api/v1/tenants/:tenantId/integrations/:integrationId/test
  // Per-integration rate limit: 10 requests/minute
  const testLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => `test:${req.params?.integrationId || 'unknown'}`
  });
  router.post('/:integrationId/test', testLimiter, wrapAsyncHandler(testIntegrationConnectivity));

  // GET /api/v1/tenants/:tenantId/integrations/:integrationId/health
  router.get('/:integrationId/health', wrapAsyncHandler(checkIntegrationHealth));
  
  return router;
}