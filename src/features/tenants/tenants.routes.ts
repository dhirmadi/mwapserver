import { Router } from 'express';
import { initTenantRoutes, createTenant, getTenant, updateTenant, deleteTenant } from './tenants.controller';
import { authenticateJWT } from '../../middleware/auth';
import { wrapAsyncHandler } from '../../utils/response';

const router = Router();


// Apply JWT authentication to all routes
router.use(authenticateJWT());

// Create tenant
router.post('/', wrapAsyncHandler(createTenant));

// Get current user's tenant
router.get('/me', wrapAsyncHandler(getTenant));

// Update tenant
router.patch('/:id', wrapAsyncHandler(updateTenant));

// Delete tenant (superadmin only)
router.delete('/:id', wrapAsyncHandler(deleteTenant));

// export default tenantRouter;
export function getTenantRouter(): Router {
    return initTenantRoutes(); // this must run *after* DB is connected
  }