import { expressjwt as jwt } from 'express-jwt';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { jwksClient } from '../config/auth0';
import { logInfo, logError, logAudit } from '../utils/logger';
import { isPublicRoute, logPublicRouteAccess, PublicRouteConfig } from './publicRoutes.js';

export const authenticateJWT = () => {
  const middleware = jwt({
    secret: async (req) => {
      try {
        const token = req.headers.authorization?.split(' ')[1] || '';
        
        // Log token information (without the actual token for security)
        logInfo('Processing JWT authentication', {
          endpoint: req.originalUrl,
          method: req.method,
          hasToken: !!token,
          tokenLength: token ? token.length : 0
        });
        
        if (!token) {
          logError('Missing authorization token', { endpoint: req.originalUrl });
          throw new Error('Missing authorization token');
        }
        
        const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString());
        
        logInfo('JWT header parsed', {
          kid: header.kid,
          alg: header.alg
        });
        
        const key = await jwksClient.getSigningKey(header.kid);
        return key.getPublicKey();
      } catch (error) {
        logError('Error processing JWT', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          endpoint: req.originalUrl
        });
        throw error;
      }
    },
    audience: env.AUTH0_AUDIENCE,
    issuer: `https://${env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256']
  });

  return (req: Request, res: Response, next: NextFunction) => {
    // Check if this is a public route that should bypass JWT authentication
    const publicRouteConfig = isPublicRoute(req.path, req.method);
    
    if (publicRouteConfig) {
      // This is a public route - skip JWT authentication but log the access
      logInfo('Public route accessed - skipping JWT authentication', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        justification: publicRouteConfig.justification,
        securityControls: publicRouteConfig.securityControls.length
      });

      // Log public route access for security monitoring
      logPublicRouteAccess(
        publicRouteConfig,
        {
          path: req.path,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          queryParams: req.query
        },
        true // Will be updated to false if the route handler fails
      );

      // Continue to the route handler without JWT authentication
      return next();
    }

    // This is a protected route - apply JWT authentication
    logInfo('Protected route - applying JWT authentication', {
      path: req.path,
      method: req.method,
      hasAuthHeader: !!req.headers.authorization
    });

    middleware(req, res, (err) => {
      if (err) {
        if (err.name === 'UnauthorizedError') {
          logError('Authentication failed', {
            error: err.message,
            code: err.code,
            endpoint: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
          
          // Log potential security issue
          logAudit('auth.failed', req.ip || 'unknown', req.originalUrl, {
            errorCode: err.code,
            errorMessage: err.message,
            method: req.method,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
          });
          
          return res.status(401).json({
            success: false,
            error: {
              code: 'auth/unauthorized',
              message: 'Invalid or expired token'
            }
          });
        }
        
        logError('Authentication error', {
          error: err.message,
          name: err.name,
          endpoint: req.originalUrl,
          method: req.method
        });
        
        return next(err);
      }
      
      // Log successful authentication
      logInfo('Authentication successful', {
        user: req.auth?.sub,
        endpoint: req.originalUrl,
        method: req.method
      });

      // Log successful authentication for audit
      logAudit('auth.success', req.auth?.sub || 'unknown', req.originalUrl, {
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      
      next();
    });
  };
};