import { expressjwt as jwt } from 'express-jwt';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { jwksClient } from '../config/auth0';
import { logInfo, logError } from '../utils/logger';

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
    middleware(req, res, (err) => {
      if (err) {
        if (err.name === 'UnauthorizedError') {
          logError('Authentication failed', {
            error: err.message,
            code: err.code,
            endpoint: req.originalUrl,
            method: req.method,
            ip: req.ip
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
          endpoint: req.originalUrl
        });
        
        return next(err);
      }
      
      // Log successful authentication
      logInfo('Authentication successful', {
        user: req.auth?.sub,
        endpoint: req.originalUrl
      });
      
      next();
    });
  };
};