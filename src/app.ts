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

// JWT Middleware - Apply authentication to all routes below this line
app.use(authenticateJWT());

// API Documentation - Protected by authentication in production
// In development, this provides interactive API documentation
app.use('/docs', getDocsRouter());

// ❗ Do not import tenant routes at the top level
// Instead expose a function that can register them later
export async function registerRoutes(): Promise<void> {
  console.log('[MWAP] 🔁 Registering routes...');
  
  // Import logger
  const { logInfo } = await import('./utils/logger');
  
  const { getTenantRouter } = await import('./features/tenants/tenants.routes');
  console.log('[MWAP] ✅ /api/v1/tenants route loaded');

  const { getProjectTypesRouter } = await import('./features/project-types/projectTypes.routes');
  console.log('[MWAP] ✅ /api/v1/project-types route loaded');

  const { getCloudProviderRouter } = await import('./features/cloud-providers/cloudProviders.routes');
  console.log('[MWAP] ✅ /api/v1/cloud-providers route loaded');

  const { getProjectsRouter } = await import('./features/projects/projects.routes');
  console.log('[MWAP] ✅ /api/v1/projects route loaded');

  const { getUserRouter } = await import('./features/users/user.routes');
  console.log('[MWAP] ✅ /api/v1/users route loaded');

  const { getOAuthRouter } = await import('./features/oauth/oauth.routes');
  console.log('[MWAP] ✅ /api/v1/oauth route loaded');

  const { getOpenAPIRouter } = await import('./features/openapi/openapi.routes');
  console.log('[MWAP] ✅ /api/v1/openapi route loaded');

  // Register all API routes
  app.use('/api/v1/tenants', getTenantRouter());
  app.use('/api/v1/project-types', getProjectTypesRouter());
  app.use('/api/v1/cloud-providers', getCloudProviderRouter());
  app.use('/api/v1/projects', getProjectsRouter());
  app.use('/api/v1/users', getUserRouter());
  app.use('/api/v1/oauth', getOAuthRouter());
  // Tighter limits for auth-related endpoints
  app.use('/api/v1/oauth/callback', authTightLimiter);
  app.use('/api/v1/openapi', getOpenAPIRouter());
  
  logInfo('All API routes registered successfully', {
    routes: [
      '/api/v1/tenants',
      '/api/v1/project-types', 
      '/api/v1/cloud-providers',
      '/api/v1/projects',
      '/api/v1/users',
      '/api/v1/oauth',
      '/api/v1/openapi'
    ],
    totalRoutes: 7
  });
  
  // Add a 404 handler as the last middleware for /api/v1 routes
  // This will only be reached if no other routes match
  app.use((req, res, next) => {
    // Only handle API routes that start with /api/v1
    if (req.path.startsWith('/api/v1')) {
      logInfo('404 Not Found for API endpoint', {
        method: req.method,
        path: req.path,
        originalUrl: req.originalUrl,
        ip: req.ip,
        headers: req.headers,
        params: req.params,
        query: req.query,
        body: req.body
      });
      
      return res.status(404).json({
        success: false,
        error: {
          code: 'route/not-found',
          message: `Endpoint not found: ${req.method} ${req.originalUrl}`
        }
      });
    }
    
    // For non-API routes, continue to the next middleware
    next();
  });
}

app.use(errorHandler);

export { app };
