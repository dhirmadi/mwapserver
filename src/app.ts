import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { authenticateJWT } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getDocsRouter } from './docs/index.js';
import { env } from './config/env.js';
import { db } from './config/db.js';

const app = express();

// In tests, delay handling requests until routes are fully registered
let routesReadyResolve: (() => void) | null = null;
const routesReadyPromise: Promise<void> = new Promise((resolve) => {
  routesReadyResolve = resolve;
});

// Trust proxy for Heroku deployment - CRITICAL for OAuth redirect URI
// Use specific trust proxy setting for production safety (trusts only first proxy)
// This allows Express to detect X-Forwarded-Proto header and resolve req.protocol as 'https'
app.set('trust proxy', 1);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(helmet());
// CORS configuration for different environments
const getAllowedOrigins = () => {
  if (env.NODE_ENV === 'production') {
    return [
      'https://mwapsp.shibari.photo',  // Production backend
      // Add production frontend URLs here when available
    ];
  } else {
    return [
      'http://localhost:3000',         // Local frontend dev server
      'http://localhost:5173',         // Vite dev server
      'https://mwapss.shibari.photo',  // Staging backend
      // Allow all origins in development for flexibility
      true
    ];
  }
};

app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true
}));

// Rate limiting
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
const authTightLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(apiRateLimiter);

// Health check (open endpoint)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// JWT middleware applied inside registerRoutes after mounting public OAuth router

// API Documentation - Protected by authentication in production
// In development, this provides interactive API documentation
app.use('/docs', getDocsRouter());

// Simplified route registration
export async function registerRoutes(): Promise<void> {
  console.log('[MWAP] 🔁 Registering simplified routes...');
  
  // Import logger
  const { logInfo } = await import('./utils/logger.js');
  
  // Import all routers
  const { getTenantRouter } = await import('./features/tenants/tenants.routes.js');
  const { getProjectTypesRouter } = await import('./features/project-types/projectTypes.routes.js');
  const { getCloudProviderRouter } = await import('./features/cloud-providers/cloudProviders.routes.js');
  const { getProjectsRouter } = await import('./features/projects/projects.routes.js');
  const { getUserRouter } = await import('./features/users/user.routes.js');
  const { getOAuthRouter } = await import('./features/oauth/oauth.routes.js');
  const { getOpenAPIRouter } = await import('./features/openapi/openapi.routes.js');

  // Register all API routes with simplified paths
  // Mount public OAuth routes BEFORE JWT middleware
  app.use('/api/v1/oauth', getOAuthRouter());

  // Apply JWT for all subsequent routes
  app.use(authenticateJWT());

  app.use('/api/v1/tenants', getTenantRouter());
  app.use('/api/v1/project-types', getProjectTypesRouter());
  app.use('/api/v1/cloud-providers', getCloudProviderRouter());
  app.use('/api/v1/projects', getProjectsRouter());
  app.use('/api/v1/users', getUserRouter());
  app.use('/api/v1/openapi', getOpenAPIRouter());
  
  logInfo('Simplified API routes registered successfully', {
    totalRoutes: 7,
    simplifications: [
      'Consolidated authentication middleware',
      'Removed redundant documentation systems',
      'Simplified route structure'
    ]
  });
  
  // Simple 404 handler for API routes - catch-all under /api/v1 after feature routers
  app.use('/api/v1', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'route/not-found',
        message: `Endpoint not found: ${req.method} ${req.originalUrl}`
      }
    });
  });

  // Register error handler last so it catches errors from all routes above
  app.use(errorHandler);

  if (process.env.NODE_ENV === 'test' && routesReadyResolve) {
    routesReadyResolve();
  }
}


export { app };
export async function whenRoutesReady(): Promise<void> {
  if (process.env.NODE_ENV !== 'test') return;
  await routesReadyPromise;
}

// Auto-register routes in test environment to ensure endpoints exist when importing app
if (process.env.NODE_ENV === 'test') {
  // Fire and forget; tests that perform DB setup will give enough time for registration
  registerRoutes().catch(() => {});
}
